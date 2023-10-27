/*global QUnit*/

sap.ui.define([
	"comirda/zeducationalexpenses/controller/EducationalExpenses.controller"
], function (Controller) {
	"use strict";

	QUnit.module("EducationalExpenses Controller");

	QUnit.test("I should test the EducationalExpenses controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
