/*
* adapt-azure
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Mike Stevens <mesgraphix@gmail.com>
*/

define([
    'core/js/models/componentModel', // add this
    'core/js/views/componentView', // change these to use proper paths
    'core/js/adapt'
],function(ComponentModel, ComponentView, Adapt) {
    'use strict';

    var Azure = ComponentView.extend({
        defaults:function() {
            return {
                player:null
            }
        },
        events: function() {
            return Adapt.device.touch == true ? {
                'inview': 'onEnded',
                'click .js-azure-inline-transcript-toggle': 'onToggleInlineTranscript',
                'click .js-azure-external-transcript-click': 'onExternalTranscriptClicked',
                'click .js-skip-to-transcript': 'onSkipToTranscript'
            } : {
                'mousemove': 'onEnded',
                'click .azure__transcript-btn-inline': 'onToggleInlineTranscript',
                'click .js-azure-external-transcript-click': 'onExternalTranscriptClicked',
                'click .js-skip-to-transcript': 'onSkipToTranscript'
            }
        },

        initialize: function() {
            ComponentView.prototype.initialize.apply(this);

            _.bindAll(this, 'onInview', 'onPlay', 'onEnded' );

            if (window.onAzureIframeAPIReady === undefined) {
                window.onAzureIframeAPIReady = function() {
                    Adapt.azureAPIReady = true;
                    Adapt.trigger('azureAPIReady');
                };
                $.getScript('assets/www-widgetapi.js');
            } 
        },

        preRender: function() {
            this.listenTo(Adapt, 'device:resize', this.setIFrameSize);
            this.listenTo(Adapt, 'device:changed', this.setIFrameSize);
        },

        setIFrameSize: function () {
            this.$('.azuremediaplayer').width(this.$('.azure__widget').width());
            this.$('iframe').width(this.$('.azure__widget').width());
            
            var aspectRatio = (this.model.get("_media")._aspectRatio ? parseFloat(this.model.get("_media")._aspectRatio) : 1.778);//default to 16:9 if not specified
            if (!isNaN(aspectRatio)) {
                this.$('.azuremediaplayer').height(this.$('.azure__widget').width() / aspectRatio);
                this.$('iframe').height(this.$('.azure__widget').width() / aspectRatio);
            }
        },

        postRender: function() {

            if (Adapt.azureAPIReady === true) {
                this.onAzureIframeAPIReady();
            } else {
                Adapt.once('azureAPIReady', this.onAzureIframeAPIReady, this)
            }
        },

        remove: function() {
            if(this.player != null) {
                this.player.dispose();
            }

            ComponentView.prototype.remove.call(this);
        },
    
        setupEventListeners: function() {
            var currentazureon = this.model.get('_id');
            this.completionEvent = (!this.model.get('_setCompletionOn')) ? 'play' : this.model.get('_setCompletionOn');
            if (this.completionEvent === "inview") {
                $('.' + currentazureon + ' .azure__widget').on('inview', this.onInview);
            } else if (this.completionEvent === "play") {
                $('.' + currentazureon + ' .azure__widget').on('inview', this.onPlay);
            } else if (this.completionEvent === "ended") {
                $('.' + currentazureon + ' .azure__widget').on('inview', this.onEnded);
            }
        },

        onSkipToTranscript: function() {
            _.delay(function() {
                this.$('.azure__transcript-btn').a11y_focus();
            }.bind(this), 250);
        },

        onInview: function(event, visible, visiblePartX, visiblePartY) {
             var currentazureon = this.model.get('_id');
             $('.' + currentazureon + ' .removeazureie').addClass('azureinviewmode');
            if (visible) {
                if (visiblePartY === 'top') {
                    this._isVisibleTop = true;
                } else if (visiblePartY === 'bottom') {
                    this._isVisibleBottom = true;
                } else {
                    this._isVisibleTop = true;
                    this._isVisibleBottom = true;
                }

                if (this._isVisibleTop && this._isVisibleBottom) {
                    this.$('.component__inner').off('inview');
                    if ( $('.' + currentazureon + ' .removeazureie').hasClass('azureinviewmode') ) {
                        this.setCompletionStatus();
                    }
                    if ( $('html').hasClass('accessibility') ) {
                        $(".js-skip-to-transcript").attr("tabindex", "0").attr("aria-label", "Skip to Transcript").text("Skip to Transcript");
                    }
                }
            }
        },
        
        //Will not track properly if using same video source
        onPlay: function(event, visible, visiblePartX, visiblePartY) {
            var currentazureon = this.model.get('_id');
            $('.' + currentazureon + ' .removeazureie').addClass('azureplaymode');
            if (visible) {
                if (visiblePartY === 'top') {
                    this._isVisibleTop = true;
                } else if (visiblePartY === 'bottom') {
                    this._isVisibleBottom = true;
                } else {
                    this._isVisibleTop = true;
                    this._isVisibleBottom = true;
                }

                if (this._isVisibleTop && this._isVisibleBottom) {
                    if ( $('.' + currentazureon + ' .azureplaymode').hasClass('vjs-has-started') ) {
                        this.setCompletionStatus();
                    }
                    if ( $('html').hasClass('accessibility') ) {
                        $(".js-skip-to-transcript").attr("tabindex", "0").attr("aria-label", "Skip to Transcript").text("Skip to Transcript");
                    }
                }
            }
        },
        
        //Will not track properly if using same video source
        onEnded: function(event, visible, visiblePartX, visiblePartY) {
            var currentazureon = this.model.get('_id');
            $('.' + currentazureon + ' .removeazureie').addClass('azureendmode');
            if (visible) {
                if (visiblePartY === 'top') {
                    this._isVisibleTop = true;

                } else if (visiblePartY === 'bottom') {
                    this._isVisibleBottom = true;
                } else {
                    this._isVisibleTop = true;
                    this._isVisibleBottom = true;
                }

                if (this._isVisibleTop && this._isVisibleBottom) {
                    $(checkForChanges);
                    if ( $('html').hasClass('accessibility') ) {
                        $(".js-skip-to-transcript").attr("tabindex", "0").attr("aria-label", "Skip to Transcript").text("Skip to Transcript");
                    }
                }
            }
            var self = this;
            function checkForChanges() {
                if ($('.' + currentazureon + ' .azureendmode').hasClass('vjs-ended')) {
                    self.setCompletionStatus();
                } else {
                    setTimeout(checkForChanges, 500);
                }
            }
        },
        
        onToggleInlineTranscript: function(e) {
          if (e && e.preventDefault) e.preventDefault();

          var $transcriptBodyContainer = this.$('.azure__transcript-body-inline');
          var $transcriptBodyContainerInner = this.$(".azure__transcript-body-inline-inner");
          var $button = this.$('.azure__transcript-btn-inline');
          var $buttonText = $button.find('.azure__transcript-btn-text');

          if ($transcriptBodyContainer.hasClass('inline-transcript-open')) {
            $transcriptBodyContainer.stop(true, true).slideUp(function() {
              $(window).resize();
            }).removeClass('inline-transcript-open');

            $button.attr('aria-expanded', false);
            $buttonText.html(this.model.get('_transcript').inlineTranscriptButton);

            return;
          }

          $transcriptBodyContainer.stop(true, true).slideDown(function() {
            $(window).resize();
          }).addClass('inline-transcript-open');
          $transcriptBodyContainerInner.a11y_focus();
          $button.attr('aria-expanded', true);
          $buttonText.html(this.model.get('_transcript').inlineTranscriptCloseButton);

          if (this.model.get('_transcript')._setCompletionOnView !== false) {
            this.setCompletionStatus();
          }
        },

        onExternalTranscriptClicked: function() {
          if (this.model.get('_transcript')._setCompletionOnView !== false) {
            this.setCompletionStatus();
          }
        },

        onAzureIframeAPIReady: function() {

            this.isPlaying = false;
            
            this.setReadyStatus();
            
            this.setupEventListeners();
            
            this.setIFrameSize();
        }

    },
    {
        template: 'azure'
    });
    
    //Adapt.register("azure", azure );
    Adapt.register('azure', {
      model: ComponentModel.extend({}), // register the model, it should be an extension of ComponentModel, an empty extension is fine
      view: Azure
    });

    return Azure;
});
