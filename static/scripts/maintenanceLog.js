var maintenanceApp = {};

function formatCost(cost) {
	let prettyCost = parseFloat(cost);

	if (Number.isNaN(prettyCost)) {
		return '-';
	}

	return "$" + prettyCost.toFixed(2).toLocaleString();
}


(function($){

	maintenanceApp.CarModel = Backbone.Model.extend({
		idAttribute: "token",
	    urlRoot: 'api/car'
	});

	maintenanceApp.ServiceRecord = Backbone.Model.extend();
	maintenanceApp.ScheduledMaintenanceModel = Backbone.Model.extend();

	maintenanceApp.MyGarage = Backbone.Collection.extend({
		model: maintenanceApp.CarModel,
		url: function() {
			return "api/car";
		}
	});

	maintenanceApp.ServiceLog = Backbone.Collection.extend({
		carId: null,
		model: maintenanceApp.ServiceRecord,
		url: function() {
			return "api/car/" + this.carId + "/service/";
		}
	});


	maintenanceApp.ScheduledMaintenanceCollection = Backbone.Collection.extend({
		carId: null,
		model: maintenanceApp.ScheduledMaintenanceModel,
		url: function() {
			return "api/car/" + this.carId + "/schedule/";
		},
	});

	maintenanceApp.MyGarageList = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'render');

			this.template = this.$el.children().clone();

			this.listenTo(this.collection, "update", this.render);
			this.listenTo(this.collection, "reset", this.render);
		},

		render: function(collection, event) {
			let that = this;

			this.$el.empty();
			_.each(this.collection.models, function(m) {
				var myGarageCarView = new maintenanceApp.MyGarageCarView({model: m, collection: this.collection, $parentEl: this.$el, template: this.template});
				myGarageCarView.on("selected", function(view) {
					that.trigger("selected", view.model);
				});
			}, this);

			if (!event.add) { //prevents refresh when just adding new car
				this.trigger("selected", this.collection.at(0));
			}
		}

	});

	maintenanceApp.MyGarageCarView = Backbone.View.extend({
		initialize: function(options) {
			_.bindAll(this, 'render');

			this.setElement(options.template.clone());

			this.$parentEl = options.$parentEl;

			this.$parentEl.append(this.$el);

			this.listenTo(this.model, "change", this.render);
			this.render();

		},

		render: function() {
			var that = this;
			var carModel = this.model.toJSON();
			this.$el.html(carModel.name);
			this.$el.on("click", function(e) {
				that.trigger("selected", that);
			});

			this.$el.show();


		}
	});

	maintenanceApp.MyGarageAddView = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'render');
			this.render();
		},

		render: function() {
			var that = this;

			//populate the years
			let startYear = new Date().getFullYear()+1;
			for (let year=startYear;year>1930;year--) {
				that.$el.find("select[name=year]").append('<option value="' + year + '">' + year + '</option>');
			}

			this.$el.submit(function(e) {
				e.preventDefault();

				//validate form
				let isFormValid = true;
				that.$el.find(".warning").hide();
				that.$el.find(".required").each(function(index, el){
					if ($.trim($(el).find("input, select").val()).length == 0){
						$(el).find(".warning .msg").html("Required");
						$(el).find(".warning").show();
				        isFormValid = false;
					}
				});

				if (!isFormValid) {
					return;
				}

				let newCar = new maintenanceApp.CarModel({
					year: that.$el.find("select[name=year]").val(),
					make: that.$el.find("input[name=make]").val(),
					model: that.$el.find("input[name=model]").val(),
					trim: that.$el.find("input[name=trim]").val(),
					mileage: that.$el.find("input[name=mileage]").val(),
				});

				that.collection.add(newCar);
				newCar.save();

				that.$el.find("select, input[type=text]").val("");
			});
		}
	});

	maintenanceApp.CarDetailView = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'render');
		},

		setModel: function(model){
			this.model = model;
			this.listenTo(this.model, "change", this.render);
		},

		render: function() {
			this.$el.find(".title").html(this.model.get("name"));
			this.$el.find(".mileage").html(this.model.get("mileage"));
			this.$el.find(".reported_on").html("(" + this.model.get("mileageReportedDays") + " days ago)");
		}

	});

	maintenanceApp.ServiceLogTableView = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'render');

			this.template = this.$el.children().clone(),

			this.listenTo(this.collection, "update", this.render);
			this.listenTo(this.collection, "reset", this.render);
		},

		render: function() {
			this.$el.empty();
			_.each(this.collection.models, function(d) {
				new maintenanceApp.ServiceLogTableRowView({model: d, $parentEl: this.$el, template: this.template});
			}, this);
		}

	});

	maintenanceApp.ServiceLogTableRowView = Backbone.View.extend({
		initialize: function(options) {
			_.bindAll(this, 'render');

			this.setElement(options.template.clone());
			this.$parentEl = options.$parentEl;

			this.$parentEl.prepend(this.$el);

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
			this.$el.find(".cost").html(formatCost(serviceRecord.cost));
			this.$el.find(".notes").html(serviceRecord.note);
			this.$el.find(".actions .edit").attr("href", "#maintenanceId=" + serviceRecord.id);
			this.$el.find(".actions .edit").on("click", function(e) {
				new maintenanceApp.ServiceRecordEditDialog({model: that.model});
			});
			this.$el.find(".actions .delete").attr("href", "#maintenanceId=" + serviceRecord.id);
			this.$el.find(".actions .delete").on("click", function(e) {
				new maintenanceApp.ServiceRecordDeleteDialog({model: that.model});
			});

			//add service attribute to each row for filtering
			this.$el.attr("service",serviceRecord.service);

			this.$el.show();

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
						var regService = $('#editRegularService').prop( "checked");
						that.model.set({
							serviceDate: sqlDate,
							id: $("#editId").val(),
							mileage: $("#editMileage").val(),
							service: $("#editService").val(),
							note: $("#editNote").val(),
							cost: $("#editCost").val(),
							regularService: regService,
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

			var that = this;

			//clears out placeholder when focused and restored it on blur
			this.$el.find("#gridCost, #gridNote, #gridService").on("focus", function(e) {
				let pHolder = $(e.currentTarget).attr('placeholder');
				$(e.currentTarget).data('placeholder',pHolder);
				$(e.currentTarget).attr('placeholder','');
			});

			this.$el.find("#gridCost, #gridNote, #gridService").on("blur", function(e) {
				let pHolder = $(e.currentTarget).data('placeholder');
				$(e.currentTarget).attr('placeholder',pHolder);
			});


			this.$el.submit(function(e) {
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

				$("#gridCost").val("");
				$("#gridService").val("");
				$("#gridService").focus();

				TableFilter.clear();
				AutoComplete.clear($("#gridService"));

			});
		},

		setModel: function(model){
			this.model = model;
			this.listenTo(this.model, "change", this.render);
		},

		render: function() {
			$("#gridMileage").attr('placeholder', this.model.get("mileage"));


		}	
	});

	maintenanceApp.ScheduledMaintenanceTableView = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'render');

			this.template = this.$el.children().clone(),

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
				let rowView = new maintenanceApp.ScheduledMaintenanceTableRowView({model: m, collection: that.collection, $parentEl: this.$el, template: this.template});
				rowView.on("addServiceLog", function(newServiceRecord) {
					that.trigger("addServiceLog", newServiceRecord);
				});
			}, this);
		},

	});

	maintenanceApp.ScheduledMaintenanceTableRowView = Backbone.View.extend({
		initialize: function(options) {
			_.bindAll(this, 'render');

			this.setElement(options.template.clone());
			this.$parentEl = options.$parentEl;

			this.$parentEl.prepend(this.$el);

			this.listenTo(this.model, "change", this.render);
			this.listenTo(this.model, "destroy", this.destroy);

			this.render();
		},

		render: function() {
			var that = this;
			var scheduledMaintenance = this.model.toJSON();

			let dueBy = new Date(scheduledMaintenance.due_by);
			this.$el.find(".date input").attr('placeholder', DATEUTILS.format(dueBy));
			if (dueBy.getTime() < Date.now()) {
				this.$el.find(".date input").addClass("passedDue");
			}

			let dueIn = scheduledMaintenance.due_in_miles;
			this.$el.find(".mileage input").attr('placeholder', parseInt(dueIn).toLocaleString());
			if (dueIn < 0) {
				this.$el.find(".mileage input").addClass("passedDue");
			}

			this.$el.find(".service").html(scheduledMaintenance.service);
			// this.$el.find(".actions .edit").attr("href", "#maintenanceId=" + scheduledMaintenance.id);
			this.$el.find(".actions .completed").attr("href", "#maintenanceId=" + scheduledMaintenance.id);
			this.$el.find(".actions .completed").on("click", function(e) {

				let gridFriendlyDate = that.$el.find(".date input").val();
				if (gridFriendlyDate.length===0) //use current date is not supplied
					gridFriendlyDate = $("#gridFriendlyDate").attr('placeholder');

				var gridMileage = that.$el.find(".mileage input").val().replace(/,/g, '');
				if (gridMileage < 500) //if the mile is less then the alert mileage copy current mileage
					gridMileage = $("#gridMileage").attr('placeholder').replace(/,/g, '');

				var newServiceRecord = new maintenanceApp.ServiceRecord({
					carId: scheduledMaintenance.carId,
					serviceDate: DATEUTILS.sql(new Date(gridFriendlyDate)),
					mileage: gridMileage,
					service: scheduledMaintenance.service,
					cost: that.$el.find(".cost input").val(),
					note: that.$el.find(".notes input").val()
				});

				that.trigger("addServiceLog", newServiceRecord)
				that.collection.remove(that.model);
			});

			//clears out placeholder when focused and restored it on blur
			this.$el.find("input[type=text]").on("focus", function(e) {
				let pHolder = $(e.currentTarget).attr('placeholder');
				$(e.currentTarget).data('placeholder',pHolder);
				$(e.currentTarget).attr('placeholder','');
			});

			this.$el.find("input[type=text]").on("blur", function(e) {
				let pHolder = $(e.currentTarget).data('placeholder');
				$(e.currentTarget).attr('placeholder',pHolder);
			});

			this.$el.show();


		},

		destroy: function() {
			this.$el.hide();
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
			if ($(this).attr("service").contains(criteria))
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
