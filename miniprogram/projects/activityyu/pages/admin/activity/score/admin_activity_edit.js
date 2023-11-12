const AdminBiz = require('../../../../../../comm/biz/admin_biz.js');
const pageHelper = require('../../../../../../helper/page_helper.js');
const cloudHelper = require('../../../../../../helper/cloud_helper.js');
const validate = require('../../../../../../helper/validate.js');
const ActivityBiz = require('../../../../biz/activity_biz.js');
const AdminActivityBiz = require('../../../../biz/admin_activity_biz.js');
const formSetHelper = require('../../../../../../cmpts/public/form/form_set_helper.js');
const projectSetting = require('../../../../public/project_setting.js');
const cacheHelper = require('../../../../../../helper/cache_helper.js');
const helper = require('../../../../../../helper/helper.js');

const CACHE_CANCEL_REASON = 'ACTIVITY_JOIN_CANCEL_REASON';
const CACHE_REFUSE_REASON = 'ACTIVITY_JOIN_REFUSE_REASON';
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		isLoad: false,
		isAllFold: true,

		parentDayIdx: 0,
		parentTimeIdx: 0,

		menuIdx: 0,

		activityId: '',

		title: '',
		titleEn: '',

		cancelModalShow: false,
		cancelAllModalShow: false,
		formReason: '',
		curIdx: -1,
		team1_score:0,
		team2_score:0
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: async function (options) {
		if (!AdminBiz.isAdmin(this)) return;
		if (!pageHelper.getOptions(this, options)) return;

		wx.setNavigationBarTitle({
			title: projectSetting.ACTIVITY_NAME + '-记分',
		});
		var upper_bound=15;
		//随机生成
		this.setData({
			e:Math.floor(Math.random() * (2 - 1 + 1)) + 1
		})
		this._loadDetail();
		// 附加参数 
		if (options && options.activityId) {
			//设置搜索菜单 
			this._getSearchMenu();

			this.setData({
				activityId: options.activityId,
				_params: {
					activityId: options.activityId
				}
			}, () => {
				this.setData({
					isLoad: true
				});
			});
		}
	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () { },

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () { },

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function () { },

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () { },

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh: async function () {
		await this._loadDetail();
		this.selectComponent("#cmpt-form").reload();
		wx.stopPullDownRefresh();
	},

	model: function (e) {
		pageHelper.model(this, e);
	},

	_loadDetail: async function () {
		if (!AdminBiz.isAdmin(this)) return;

		let id = this.data.id;
		if (!id) return;

		if (!this.data.isLoad) this.setData(AdminActivityBiz.initFormData(id)); // 初始化表单数据

		let params = {
			id
		};
		let opt = {
			title: 'bar'
		};
		let activity = await cloudHelper.callCloudData('admin/activity_detail', params, opt);
		if (!activity) {
			this.setData({
				isLoad: null
			})
			return;
		};

		if (!Array.isArray(activity.ACTIVITY_JOIN_FORMS) || activity.ACTIVITY_JOIN_FORMS.length == 0)
		activity.ACTIVITY_JOIN_FORMS = projectSetting.ACTIVITY_JOIN_FIELDS;


		this.setData({
			isLoad: true,
			formTitle: activity.ACTIVITY_TITLE,
			formCateId: activity.ACTIVITY_CATE_ID,
			formOrder: activity.ACTIVITY_ORDER,

			formMaxCnt: activity.ACTIVITY_MAX_CNT,
			formStart: activity.ACTIVITY_START,
			formEnd: activity.ACTIVITY_END,
			formStop: activity.ACTIVITY_STOP,

			formAddress: activity.ACTIVITY_ADDRESS,
			formAddressGeo: activity.ACTIVITY_ADDRESS_GEO,

			formCheckSet: activity.ACTIVITY_CHECK_SET,
			formCancelSet: activity.ACTIVITY_CANCEL_SET,
			formIsMenu: activity.ACTIVITY_IS_MENU,

			formForms: activity.ACTIVITY_FORMS,
			formJoinForms: formSetHelper.initFields(activity.ACTIVITY_JOIN_FORMS),

		});

	},

	bindFormSubmit1: async function () {
		if(parseInt(this.data.team1_score)%2==0){
			var current_server='现在由1队左侧选手发球';
		}else{
			var current_server='现在由1队右侧选手发球';
		}
		this.setData({
			team1_score:parseInt(this.data.team1_score)+1,
			Current_server:current_server
		})
		
		this.formMaxCntFocus();
	},

	bindFormSubmit2: async function () {
		if(parseInt(this.data.team2_score)%2==0){
			var current_server='现在由2队左侧选手发球';
		}else{
			var current_server='现在由2队右侧选手发球';
		}
		this.setData({
			team2_score:parseInt(this.data.team2_score)+1,
			Current_server:current_server
		})
		this.formMaxCntFocus();
	},

	formMaxCntFocus: async function(){
		if(parseInt(this.data.team1_score)==this.data.upper_bound || parseInt(this.data.team2_score)==this.data.upper_bound){
			pageHelper.showModal('已到达15倍数的分数，请换场');
		}
		let a=parseInt(this.data.team1_score);
		let b=parseInt(this.data.team2_score);
		let c=Math.max(a,b);
		// let d=Math.ceil(c/15);
		let d=parseInt(c/15)+1;
		this.setData({
			upper_bound:parseInt(d*15),
		})
	},

	bindFormSubmit: async function () {
		if (!AdminBiz.isAdmin(this)) return;

		// 数据校验
		let data = this.data;
		data = validate.check(data, AdminActivityBiz.CHECK_FORM, this);
		if (!data) return;

		if (data.end < data.start) {
			return pageHelper.showModal('结束时间不能早于开始时间');
		}

		let forms = this.selectComponent("#cmpt-form").getForms(true);
		if (!forms) return;
		data.forms = forms;

		data.cateName = ActivityBiz.getCateName(data.cateId);

		try {
			let activityId = this.data.id;
			data.id = activityId;

			// 先修改，再上传 
			await cloudHelper.callCloudSumbit('admin/activity_edit', data).then(res => {
				// 更新列表页面数据
				let node = {
					'ACTIVITY_TITLE': data.title,
					'ACTIVITY_CATE_NAME': data.cateName,
					'ACTIVITY_ORDER': data.order,
					'ACTIVITY_START': data.start,
					'ACTIVITY_END': data.end,
					'ACTIVITY_STOP': data.stop,
					'ACTIVITY_MAX_CNT': data.maxCnt,
					'ACTIVITY_CHECK_SET': data.checkSet,
					'ACTIVITY_CANCEL_SET': data.cancelSet,
					'ACTIVITY_IS_MENU': data.isMenu,
					statusDesc: res.data.statusDesc
				}
				pageHelper.modifyPrevPageListNodeObject(activityId, node);
			});

			await cloudHelper.transFormsTempPics(forms, 'activity/', activityId, 'admin/activity_update_forms');

			let callback = () => {
				wx.navigateBack();
			}
			pageHelper.showSuccToast('修改成功', 2000, callback);

		} catch (err) {
			console.log(err);
		}

	},

	bindMapTap: function (e) {
		AdminActivityBiz.selectLocation(this);
	},

	url: function (e) {
		pageHelper.url(e, this);
	},

	switchModel: function (e) {
		pageHelper.switchModel(this, e);
	},

	bindJoinFormsCmpt: function (e) {
		this.setData({
			formJoinForms: e.detail,
		});
	},

	url: async function (e) {
		pageHelper.url(e, this);
	},

	bindUnFoldTap: function (e) {
		let idx = pageHelper.dataset(e, 'idx');
		let dataList = this.data.dataList;
		dataList.list[idx].fold = false;
		this.setData({
			dataList
		});
	},

	bindFoldTap: function (e) {
		let idx = pageHelper.dataset(e, 'idx');
		let dataList = this.data.dataList;
		dataList.list[idx].fold = true;
		this.setData({
			dataList
		});
	},

	bindFoldAllTap: function (e) {
		let dataList = this.data.dataList;
		for (let k = 0; k < dataList.list.length; k++) {
			dataList.list[k].fold = true;
		}
		this.setData({
			isAllFold: true,
			dataList
		});
	},

	bindUnFoldAllTap: function (e) {
		let dataList = this.data.dataList;
		for (let k = 0; k < dataList.list.length; k++) {
			dataList.list[k].fold = false;
		}
		this.setData({
			isAllFold: false,
			dataList
		});
	},

	bindCopyTap: function (e) {
		let idx = pageHelper.dataset(e, 'idx');
		let forms = this.data.dataList.list[idx].ACTIVITY_JOIN_FORMS;

		let ret = '';

		if (this.data.title)
			ret += `活动：${this.data.title}\r`;

		for (let k = 0; k < forms.length; k++) {
			if(forms[k].title=='姓名')
				ret += forms[k].title + '：' + forms[k].val + '\r';
		}
		wx.setClipboardData({
			data: ret,
			success(res) {
				wx.getClipboardData({
					success(res) {
						pageHelper.showSuccToast('已复制到剪贴板');
					}
				})
			}
		});

	},

	bindCancelTap: function (e) {
		this.setData({
			formReason: cacheHelper.get(CACHE_CANCEL_REASON) || '',
			curIdx: pageHelper.dataset(e, 'idx'),
			cancelModalShow: true
		});
	},

	bindCancelAllTap: function (e) {
		this.setData({
			formReason: '',
			cancelAllModalShow: true
		});
	},

	bindCancelCmpt: async function () {
		let e = {
			currentTarget: {
				dataset: {
					status: 99,
					idx: this.data.curIdx
				}
			}
		}
		cacheHelper.set(CACHE_CANCEL_REASON, this.data.formReason, 86400 * 365);
		await this.bindStatusTap(e);
	},

	bindCancelAllCmpt: async function () {
		try {
			let params = {
				reason: this.data.formReason,
				activityId: this.data.activityId
			}
			let opt = {
				title: '处理中'
			}
			await cloudHelper.callCloudSumbit('admin/activity_cancel_join_all', params, opt).then(res => {
				let callback = () => {
					wx.redirectTo({
						url: `admin_activity_join_list?activityId=${this.data.activityId}&title=${this.data.titleEn}`,
					});
				}
				pageHelper.showSuccToast('处理完成', 1500, callback);
			})
		} catch (err) {
			console.log(err);
		};
	},

	bindCheckinTap: async function (e) {
		let flag = Number(pageHelper.dataset(e, 'flag'));

		let callback = async () => {
			let idx = Number(pageHelper.dataset(e, 'idx'));
			let dataList = this.data.dataList;
			let activityJoinId = dataList.list[idx]._id;
			let params = {
				activityJoinId,
				flag,
			}
			let opts = {
				title: '处理中'
			}
			try {
				await cloudHelper.callCloudSumbit('admin/activity_join_checkin', params, opts).then(res => {
					let cb = () => {
						let sortIndex = this.selectComponent('#cmpt-comm-list').getSortIndex();
						if (sortIndex >= 8 && !this.data.search) { // 全部或者检索的结果
							dataList.list.splice(idx, 1);
							dataList.total--;
						} else {
							dataList.list[idx].ACTIVITY_JOIN_IS_CHECKIN = flag;
						}
						this.setData({
							dataList
						});
					}

					pageHelper.showSuccToast('操作成功', 1000, cb);


				});
			} catch (err) {
				console.error(err);
			}
		}
		if (flag == 1)
			pageHelper.showConfirm('确认「签到核销」？', callback);
		else if (flag == 0)
			pageHelper.showConfirm('确认「取消签到」？', callback);

	},

	bindDelTap: async function (e) {

		let callback = async () => {
			let idx = Number(pageHelper.dataset(e, 'idx'));
			let dataList = this.data.dataList;
			let activityJoinId = dataList.list[idx]._id;
			let params = {
				activityJoinId
			}
			let opts = {
				title: '删除中'
			}
			try {
				await cloudHelper.callCloudSumbit('admin/activity_join_del', params, opts).then(res => {

					let cb = () => {
						let dataList = this.data.dataList;
						dataList.list.splice(idx, 1);
						dataList.total--;
						this.setData({
							dataList
						});
					}

					pageHelper.showSuccToast('删除成功', 1000, cb);
				});
			} catch (err) {
				console.error(err);
			}
		}

		pageHelper.showConfirm('确认删除该报名记录？ 删除后用户将无法查询到本报名记录', callback);


	},

	bindStatusTap: async function (e) {
		let status = Number(pageHelper.dataset(e, 'status'));
		let oldStatus = Number(pageHelper.dataset(e, 'old'));

		let callback = async () => {
			let idx = Number(pageHelper.dataset(e, 'idx'));
			let dataList = this.data.dataList;
			let activityJoinId = dataList.list[idx]._id;
			let params = {
				activityJoinId,
				status,
				reason: this.data.formReason
			}
			let opts = {
				title: '处理中'
			}
			try {
				await cloudHelper.callCloudSumbit('admin/activity_join_status', params, opts).then(res => {
					pageHelper.showSuccToast('操作成功', 1000);
					let sortIndex = this.selectComponent('#cmpt-comm-list').getSortIndex();

					if (sortIndex != -1 && sortIndex != 5 && !this.data.search) { // 全部或者检索的结果
						dataList.list.splice(idx, 1);
						dataList.total--;
					} else {
						dataList.list[idx].ACTIVITY_JOIN_REASON = this.data.formReason;
						dataList.list[idx].ACTIVITY_JOIN_STATUS = status;
						dataList.list[idx].ACTIVITY_JOIN_IS_CHECKIN = 0;
					}

					this.setData({
						cancelModalShow: false,
						formReason: '',
						curIdx: -1,
						dataList
					});

				});
			} catch (err) {
				console.error(err);
			}
		}

		switch (status) {
			case 99:
				await callback();
				break;
			case 1: {

				if (oldStatus == 0)
					pageHelper.showConfirm('确认变更为「报名成功」状态？', callback);
				else if (oldStatus == 99)
					pageHelper.showConfirm('确认变更为「报名成功」状态？', callback);
				break;
			}
		}

	},

	bindCommListCmpt: function (e) {

		if (helper.isDefined(e.detail.search))
			this.setData({
				search: '',
				sortType: '',
			});
		else {
			let dataList = e.detail.dataList;
			if (dataList) {
				for (let k = 0; k < dataList.list.length; k++) {
					dataList.list[k].fold = this.data.isAllFold;
				}
			}

			this.setData({
				dataList,
			});
			if (e.detail.sortType)
				this.setData({
					sortType: e.detail.sortType,
				});
		}

	},

	// 修改与展示状态菜单
	_getSearchMenu: function () {

		let sortItems = [];
		let sortMenus = [
			{ label: '全部', type: '', value: '' },
			{ label: `待审核`, type: 'status', value: 0 },
			{ label: `报名成功`, type: 'status', value: 1 },
			{ label: `未过审`, type: 'status', value: 99 },
			{ label: `已签到`, type: 'checkin', value: 1 },
			{ label: `未签到`, type: 'checkin', value: 0 }
		];
		this.setData({
			sortItems,
			sortMenus
		})


	},

	bindClearReasonTap: function (e) {
		this.setData({
			formReason: ''
		})
	}
})
	
