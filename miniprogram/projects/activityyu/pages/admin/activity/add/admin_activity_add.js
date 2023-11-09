const AdminBiz = require('../../../../../../comm/biz/admin_biz.js');
const pageHelper = require('../../../../../../helper/page_helper.js');
const cloudHelper = require('../../../../../../helper/cloud_helper.js');
const AdminActivityBiz = require('../../../../biz/admin_activity_biz.js');
const ActivityBiz = require('../../../../biz/activity_biz.js');
const validate = require('../../../../../../helper/validate.js');
const PublicBiz = require('../../../../../../comm/biz/public_biz.js');
const projectSetting = require('../../../../public/project_setting.js');

Page({

	/**
	 * 页面的初始数据
	 */
	data: {

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: async function (options) {
		if (!AdminBiz.isAdmin(this)) return;

		wx.setNavigationBarTitle({
			title: projectSetting.ACTIVITY_NAME + '-添加',
		});

		this.setData(AdminActivityBiz.initFormData());
		this.setData({
			isLoad: true
		});
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

	url: function (e) {
		pageHelper.url(e, this);
	},
	switchModel: function (e) {
		pageHelper.switchModel(this, e);
	},

	bindFormSubmit: async function () {
		if (!AdminBiz.isAdmin(this)) return;

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

			// 创建
			// let result = await cloudHelper.callCloudSumbit('admin/activity_insert', data);
			wx.cloud.database().collection('bx_activity').add({ 
                data1:{"id":data.id, 
                "ACTIVITY_TITLE":data.title, 
                "ACTIVITY_CATE_ID":data.cateId, 
                "ACTIVITY_CATE_NAME":data.cateName, 
                "ACTIVITY_ADDRESS":data.ACTIVITY_ADDRESS, 
                "ACTIVITY_START":1699449812217, 
                "ACTIVITY_END":1702041812217, 
                "ACTIVITY_STOP":1702041812217, 
                "ACTIVITY_JOIN_FORMS":[{"type":"text","title":"姓名","must":true},{"type":"mobile","title":"手机","must":true}], 
                "ACTIVITY_OBJ":{"cover":["/images/cover.gif"], 
                "img":["/images/cover.gif"], 
                "time":3,"fee":"100","desc":[{"type":"text","val":"活动1详情介绍"}]}, 
                "_pid":"activityyu", 
                "ACTIVITY_ID":"20231108212334011", 
                "ACTIVITY_ADD_TIME":1699449814011, 
                "ACTIVITY_EDIT_TIME":1699496878640, 
                "ACTIVITY_ADD_IP":"112.48.20.75", 
                "ACTIVITY_EDIT_IP":"", 
                "ACTIVITY_STATUS":1, 
                "ACTIVITY_CANCEL_SET":1, 
                "ACTIVITY_CHECK_SET":0, 
                "ACTIVITY_IS_MENU":1, 
                "ACTIVITY_MAX_CNT":20, 
                "ACTIVITY_ORDER":9999, 
                "ACTIVITY_VOUCH":0, 
                "ACTIVITY_FORMS":[], 
                "ACTIVITY_ADDRESS_GEO":{}, 
                "ACTIVITY_QR":"", 
                "ACTIVITY_VIEW_CNT":21, 
                "ACTIVITY_JOIN_CNT":1, 
                "ACTIVITY_COMMENT_CNT":0, 
                "ACTIVITY_USER_LIST":[{"USER_MINI_OPENID":"activityyu^^^oFe-55Cw8n0glHdZc2nRMwN0DQ8U", 
                "USER_NAME":"hxy", 
                "USER_PIC":"cloud://competition-7gp85b07182c11ba.636f-competition-7gp85b07182c11ba-1305199338/activityyu/user/20231108/2676101.jpg"}]}, 
                success(res){ 
                  /* console.log(res) */ 
                  wx.navigateBack({ 
                    success(){ 
                      wx.showToast({ 
                        title: '发表成功！', 
                      }) 
                    } 
                  }) 
                   
                } 
              }) 
			let activityId = data.id;

			// 图片
			await cloudHelper.transFormsTempPics(forms, 'activity/', activityId, 'admin/activity_update_forms');

			let callback = async function () {
				PublicBiz.removeCacheList('admin-activity-list');
				PublicBiz.removeCacheList('activity-list');
				wx.navigateBack();

			}
			pageHelper.showSuccToast('添加成功', 2000, callback);

		} catch (err) {
			console.log(err);
		}
	},

	bindJoinFormsCmpt: function (e) {
		this.setData({
			formJoinForms: e.detail,
		});
	},

	bindMapTap: function (e) {
		AdminActivityBiz.selectLocation(this);
	}
})