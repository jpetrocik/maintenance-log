var maintenanceApp = {};

(function($){

	maintenanceApp.ServiceRecord = Backbone.Model.extend();

	maintenanceApp.ServiceLog = Backbone.Collection.extend({
		carId: null,
		model: maintenanceApp.ServiceRecord,
		url: function() {
			return "api/car/" + this.carId + "/service/";
		}
	});

	maintenanceApp.ServiceLogTableView = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'render');

			this.listenTo(this.collection, "update", this.render);
			this.listenTo(this.collection, "reset", this.render);
		},

		render: function() {
			this.$el.empty();
			_.each(this.collection.models, function(d) {
				new maintenanceApp.ServiceLogTableRowView({model: d});
			}, this);
		}

	});

	maintenanceApp.ServiceLogTableRowView = Backbone.View.extend({
		template: $("#serviceGrid").children().clone(),
		parent: $("#serviceGrid"),
		initialize: function() {
			_.bindAll(this, 'render');

			this.$el = this.template.clone();
			this.$el.show();

			this.parent.prepend(this.$el);

			this.listenTo(this.model, "change", this.render);
			this.listenTo(this.model, "destroy", this.destroy);
			this.render();
		},

		render: function() {
			var that = this;
			var serviceRecord = this.model.toJSON();
			this.$el.find(".date").html(DATEUTILS.format(new Date(serviceRecord.serviceDate)));
			this.$el.find(".mileage").html(parseInt(serviceRecord.mileage).toLocaleString());
			this.$el.find(".service").html(serviceRecord.service);
			this.$el.find(".cost").html("$" + parseFloat(serviceRecord.cost).toFixed(2).toLocaleString());
			this.$el.find(".notes").html(serviceRecord.note);
			this.$el.find(".actions .edit").attr("href", "#maintenanceId=" + serviceRecord.id);
			this.$el.find(".actions .edit").on("click", function(e) {
				new maintenanceApp.ServiceRecordEditDialog({model: that.model});
			});
			this.$el.find(".actions .delete").attr("href", "#maintenanceId=" + serviceRecord.id);
			this.$el.find(".actions .delete").on("click", function(e) {
				new maintenanceApp.ServiceRecordDeleteDialog({model: that.model});
			});
			//this.$el.attr("data",serviceRecord.service);
		},

		destroy: function() {
			this.$el.hide();
		}

	});

	maintenanceApp.ServiceRecordEditDialog = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'render');
			this.render();
		},

		render: function() {
			var that = this;
			$( "#editLogDialog" ).dialog( "option", "buttons", 
				{
					OK: function () {

						$(this).dialog("close");
						var sqlDate = DATEUTILS.sql(new Date($("#editFriendlyDate").val()));
						that.model.set({
							serviceDate: sqlDate,
							id: $("#editId").val(),
							mileage: $("#editMileage").val(),
							service: $("#editService").val(),
							note: $("#editNote").val(),
							cost: $("#editCost").val(),
							regularService: $("#editRegularService").val(),
							mileageInterval: $("#editMileageInterval").val(),
							monthsInterval: $("#editMonthsInterval").val(),
						});
						that.model.save();

					}
				}
			);
  
  			var log = this.model.toJSON();
		    $('#editFriendlyDate').val(DATEUTILS.format(new Date(log.serviceDate)));
			$("#editId").val(log.id);
			$("#editMileage").val(log.mileage);
			$("#editService").val(log.service);
			$("#editNote").val(log.note);
			$("#editCost").val(log.cost);

			//hide regular service form
			$('#editServiceForm').hide();
			$('#editRegularService').prop( "checked", false );
			$('#editMileageInterval').val("");
			$('#editMonthsInterval').val("");

		    $( "#editLogDialog" ).dialog( "open" );

		}
	});

	maintenanceApp.ServiceRecordDeleteDialog = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'render');
			this.render();
		},

		render: function() {
			var that = this;
			$( "#deleteLogDialog" ).dialog( "option", "buttons", 
				{
					Cancel: function () {
						$(this).dialog("close");
					},

					OK: function () {
						$(this).dialog("close");
						that.model.destroy();

					}
				}
			);
  
  			var log = this.model.toJSON();
			$("#deleteMileage").html(log.mileage);
			$("#deleteService").html(log.service);

		    $( "#deleteLogDialog" ).dialog( "open" );

		}
	});

	/**
	 * The form on the top row of the service log for adding new service
	 * records to the log
	 **/
	maintenanceApp.ServiceRecordAddView = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'render');
			this.render();
		},

		render: function() {
			var that = this;
			$("#maintenance").submit(function(e) {
				e.preventDefault();
				
				var gridFriendlyDate = $("#gridFriendlyDate").val();
				if (gridFriendlyDate.length===0)
					gridFriendlyDate = $("#gridFriendlyDate").attr('placeholder');

				var gridMileage = $("#gridMileage").val().replace(/,/g, '');
				if (gridMileage.length===0)
					gridMileage = $("#gridMileage").attr('placeholder').replace(/,/g, '');

				var log = new maintenanceApp.ServiceRecord({
					carId: that.collection.carId,
					serviceDate: DATEUTILS.sql(new Date(gridFriendlyDate)),
					mileage: gridMileage,
					service: $("#gridService").val(),
					cost: $("#gridCost").val(),
					note:  $("#gridNote").val()
				});

				that.collection.add(log);
				log.save();

				TableFilter.clear();
				AutoComplete.clear($("#gridService"));
				$("#gridCost").val("");
				$("#gridService").val("");
				$("#gridService").focus();
			});
		}	
	});

	maintenanceApp.ScheduledMaintenanceModel = Backbone.Model.extend();

	maintenanceApp.ScheduledMaintenanceCollection = Backbone.Collection.extend({
		carId: null,
		model: maintenanceApp.ScheduledMaintenanceModel,
		url: function() {
			return "api/car/" + this.carId + "/schedule/";
		}
	});

	maintenanceApp.ScheduledMaintenanceTableView = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'render');

			this.listenTo(this.collection, "update", this.render);
			this.listenTo(this.collection, "reset", this.render);

		},

		render: function() {
			let that=this;
			this.$el.empty();
			if (this.collection.length > 0) {
				$('#service_due_alert').fadeIn();
			} else {
				$('#service_due_alert').hide();
			}
			_.each(this.collection.models, function(m) {
				let rowView = new maintenanceApp.ScheduledMaintenanceTableRowView({model: m, collection: that.collection});
				rowView.setServiceLog(this.serviceLog);
			}, this);
		},

		setServiceLog: function(serviceLog){
			this.serviceLog=serviceLog;
		}

	});

	maintenanceApp.ScheduledMaintenanceTableRowView = Backbone.View.extend({
		template: $("#scheduledMaintenanceGrid").children().clone(),
		parent: $("#scheduledMaintenanceGrid"),
		initialize: function() {
			_.bindAll(this, 'render');

			this.setElement(this.template.clone());
			this.$el.show();

			this.parent.prepend(this.$el);

			this.listenTo(this.model, "change", this.render);
			this.listenTo(this.model, "destroy", this.destroy);
			this.render();
		},

		render: function() {
			var that = this;
			var scheduledMaintenance = this.model.toJSON();
			this.$el.find(".date").html(DATEUTILS.format(new Date(scheduledMaintenance.due_by)));
			this.$el.find(".mileage").html(parseInt(scheduledMaintenance.due_in_miles).toLocaleString());
			this.$el.find(".service").html(scheduledMaintenance.service);
			// this.$el.find(".actions .edit").attr("href", "#maintenanceId=" + scheduledMaintenance.id);
			this.$el.find(".actions .completed").attr("href", "#maintenanceId=" + scheduledMaintenance.id);
			this.$el.find(".actions .completed").on("click", function(e) {

				var gridFriendlyDate = $("#gridFriendlyDate").val();
				if (gridFriendlyDate.length===0)
					gridFriendlyDate = $("#gridFriendlyDate").attr('placeholder');

				var gridMileage = $("#gridMileage").val().replace(/,/g, '');
				if (gridMileage.length===0)
					gridMileage = $("#gridMileage").attr('placeholder').replace(/,/g, '');

				var newServiceRecord = new maintenanceApp.ServiceRecord({
					carId: scheduledMaintenance.carId,
					serviceDate: DATEUTILS.sql(new Date(gridFriendlyDate)),
					mileage: gridMileage,
					service: scheduledMaintenance.service,
					cost: that.$el.find(".cost input").val(),
					note: that.$el.find(".notes input").val()
				});

				that.serviceLog.add(newServiceRecord);
				newServiceRecord.save();
				that.collection.remove(that.model);
			});
			//this.$el.attr("data",log.service);

		},

		destroy: function() {
			this.$el.hide();
		},

		setServiceLog: function(serviceLog){
			this.serviceLog=serviceLog;
		}


	});

	})(jQuery);

var DATEUTILS = {
	regex: /^(January|February|March|April|May|June|July|August|September|November|December)\s\d{1,2},\s20\d\d$/i,
	format: function(d){
		return this.months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
	},
	sql: function(d){
		return d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate();
	},
	isValid: function(s) {
		return !(s.match(DATEUTILS.regex) === null);
	},
	months: ["January","February","March","April","May","June","July","August","September","October", "November","December"]
}

var SERVICE_AUTOCOMPLETE_PLUGIN = {
	filter: function(collection, criteria){
		return jQuery.grep(collection.toJSON(), function( n, i ){
	        	return n.service.contains(criteria)});
	},
	render: function(matched){
		return matched.service;
	}
};

var DATE_AUTOCOMPELTE_PLUGIN = {
	filter: function(collection, criteria){
		return jQuery.grep(collection, function( n, i ){
	        	return n.startsWith(criteria)});
	},
 	render: function(match){
		return match;
	}
};

var TableFilter = {
	create: function(selector, tableEl) {
		var that = this;
		$(selector).on('keypress', function(e){
			that.filter($(this).data("inlineauto"), tableEl);
		});

		return this;
	},
	filter: function (criteria, tableEl) {
		console.log("Filter: " + criteria);
		$(tableEl).each(function( index ) {
			if ($(this).attr("data").contains(criteria))
				$(this).show();
			else 
				$(this).hide();
		});
	},
	clear: function(){
		//should use tableEl varaible but currently not visible
		$("#serviceGrid tr").show();
	}

};

var AutoComplete = {
	create: function(selector, plugin, collection) {
		var that = this;
		$(selector).on('focus', function(e){
		    $(this).data("inlineauto",$(this).val())
		});
		$(selector).on('keypress', function(e){
			if (that.doComplete($(this), e.which, collection, plugin))
	        	e.preventDefault();
		});
		$(selector).on('keydown', function(e){
			if (e.which === 8){
		        if ($(this).data("inlineauto")){
				    e.preventDefault();
		        	var curVal = $(this).data("inlineauto");
		        	var newVal = curVal.substring(0,curVal.length-1);
			        $(this).val(newVal);
				    $(this).data("inlineauto",newVal);
				}
			}
		});

		return this;
	},
	doComplete: function (inputField, keyChar, collection, plugin){
			var key = String.fromCharCode(keyChar),
	        	criteria;

			if (keyChar === 13){
				return false;
			}

	        //append current key to autocomplete
	        if (inputField.data("inlineauto")){
		        criteria = inputField.data("inlineauto") + key;
		    } else {
		    	criteria = key;
		    }

	        //save current autocomplete value
		    inputField.data("inlineauto",criteria);

	        console.log("Autocomplete: " + criteria);

	        //find matching values
	        var matched =plugin.filter(collection,criteria);

	        //if no match set value to current autocomplete
	        if (matched.length==0) {
	        	inputField.val(criteria);
	    	} else {
	    		//display the match but keep cursor position
	        	inputField.val(plugin.render(matched[0]));
	        }

		    return true;
	},
	clear: function(inputField){
		inputField.val("");
		inputField.removeData("inlineauto");
	}
};

var UTILS = {
	hashParam: function(link){
		var hash = link.substring(link.indexOf('#')+1);
    	var params = hash.split('&');
    	var result = {};
    	for(var i = 0; i < params.length; i++){
       		var propval = params[i].split('=');
       		result[propval[0]] = propval[1];
       	}

       	return result;
	}
}


String.prototype.contains = function(it) { return this.indexOf(it) != -1; };	
