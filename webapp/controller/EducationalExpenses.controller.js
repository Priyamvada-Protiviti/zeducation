sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/m/MessageBox"], function (Controller, JSONModel, MessageBox) {
  "use strict";
  return Controller.extend("com.irda.zeducationalexpenses.controller.EducationalExpenses", {
    onInit: function () {
      var oViewModel = new JSONModel({
          enabled: true,
          btnSaveDraft: true,
          btnPrint: false,
          btnBack: false,
          btnText: "Save Draft",
          btnMode: false,
          currentDate: this.getFormattedDate(),
        }),
        oFormModel = new JSONModel();
        
      this.getView().setModel(oFormModel, "oFormModel");
      this.getView().setModel(oViewModel, "oViewModel");
      this.wizard = this.byId("idDeclarationWizard");
      this.wizard._getProgressNavigator().ontap = function () {};
      this.oModel = this.getOwnerComponent().getModel();
      var aFilters = [];
      //var oUser = sap.ushell.Container.getUser();
      aFilters.push(new sap.ui.model.Filter([new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, "00050028")], false));
      aFilters.push(new sap.ui.model.Filter([new sap.ui.model.Filter("Fyear", sap.ui.model.FilterOperator.EQ, new Date().getFullYear())], false));
      this.oModel.read("/EsChildEducationForm", {
        filters: aFilters,
        success: function (oResponse) {
          oFormModel.setData(oResponse.results[0]);
          if (oResponse.results && oResponse.results[0].Status === "P") {
            MessageBox.information(oResponse.results[0].Message);
            this.getView().getModel("oViewModel").setProperty("/btnSaveDraft", false);
            this.getView().getModel("oViewModel").setProperty("/editMode", false);
            this.getView().getModel("oViewModel").setProperty("/btnNext", true);
          }
        }.bind(this),
        error: function (oError) {
          //  console.log(oError);
        },
      });
    },

    onValidateTable: function (oEvent) {
      var oTable = this.getView().byId("idProductsTable");
      var aItems = oTable.getItems();
      var oModel = new sap.ui.model.json.JSONModel();
      this.getOwnerComponent().setModel(oModel, "name");

      for (var i = 0; i < aItems.length; i++) {
        var oCells = aItems[i].getCells();
        for (var f = 0; f < oCells.length; f++) {
          oCells[f].setValueState(sap.ui.core.ValueState.Error);
          return;
        }
      }
    },

    getFormattedDate: function () {
      var options = {
        year: "numeric",
        month: "short",
        day: "2-digit",
      };
      var sLang = sap.ui.getCore().getConfiguration().getLanguage();
      if (sLang === "hi") {
        return this.getFormattedDateInHindi(options);
      } else {
        return this.getFormattedDateInEnglish(options);
      }
    },
    getFormattedDateInHindi: function (options) {
      var formattedDate = new Date().toLocaleDateString("hi-IN", options);
      formattedDate = formattedDate.replace(/\d/g, function (match) {
        var hindiNumerals = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
        return hindiNumerals[parseInt(match)];
      });
      return formattedDate;
    },
    getFormattedDateInEnglish: function (options) {
      return new Date().toLocaleDateString("en-US", options);
    },

    onSaveDraft: function (oEvent) {
      var oViewModel = this.getView().getModel("oViewModel");
      if (oEvent.getSource().getText() === "Save Draft") {
        oViewModel.setProperty("/btnText", "Check and Send");
        oViewModel.setProperty("/btnBack", true);
        oViewModel.setProperty("/enabled", false);
        this.saveFormData("D");
      } else if (oEvent.getSource().getText() === "Check and Send") {
        oViewModel.setProperty("/btnBack", false);
        oViewModel.setProperty("/btnSaveDraft", true);
        this.saveFormData("P");
      }
      this.wizard.nextStep();
    },

    saveFormData: function (sStatus) {
      var oData = this.getView().getModel("oFormModel").getData();
      oData.Status = sStatus;
      oData.Fyear = new Date().getFullYear().toString();
      this.oModel.create("/EsChildEducationForm", oData, {
        success: function (oResponse) {
          MessageBox.success(oResponse.Message);
          this.getView().getModel("oFormModel").setData(oResponse);
          if (oResponse.Status === "P") {
            this.getView().getModel("oViewModel").setProperty("/btnSaveDraft", false);
            this.getView().getModel("oViewModel").setProperty("/editMode", false);
            this.getView().getModel("oViewModel").setProperty("/btnNext", true);
          }
        }.bind(this),
        error: function () {
          MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("failSave"));
        }.bind(this),
      });
    },

    onDataValidation: function (oEvent) {
      var sColumnType = oEvent.getSource().getType();
      var oViewModel = this.getView().getModel("oViewModel");
      var sValue = oEvent.getSource().getValue();
      var iValue = oEvent.getSource().getValue();

      if (sColumnType === "Number") {
        if (sValue === "") {
          oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
          oEvent.getSource().setValueStateText("Enter an Value.");
        } else {
          oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
        }
      } else if (iValue === "" || iValue === null) {
        oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
        oEvent.getSource().setValueStateText("Enter an Value.");
      } else if (sColumnType === "Text") {
        if (!/^[A-Z].*$/.test(sValue)) {
          oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
          oEvent.getSource().setValueStateText("Invalid input format. Text should start with a capital letter and number should not be used");
        } else {
          oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
          oViewModel.setProperty("/btnMode", true);
        }
      } else {
        oViewModel.setProperty("/btnMode", true);
      }
      this.onValidateTable();
    },
    onBack: function () {
      var oViewModel = this.getView().getModel("oViewModel");
      oViewModel.setProperty("/btnSaveDraft", true);
      oViewModel.setProperty("/btnBack", false);
      oViewModel.setProperty("/btnText", "Save Draft");
      oViewModel.setProperty("/enabled", true);
      this.wizard.previousStep();
    },
    onChangeLanguage: function (oEvent) {
      var selectedItemKey = oEvent.getParameter("selectedItem").getKey();
      sap.ui.getCore().getConfiguration().setLanguage(selectedItemKey);
      this.updateFormattedDate();
      this.getView().getModel("oViewModel").refresh();
    },
    updateFormattedDate: function () {
      var oViewModel = this.getView().getModel("oViewModel");
      oViewModel.setProperty("/currentDate", this.getFormattedDate());
    },
  });
});
