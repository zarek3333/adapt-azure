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
                'touchmove': 'onEnded',
                'touchmove': 'trackplayAMP',
                'click .js-azure-inline-transcript-toggle': 'onToggleInlineTranscript',
                'click .js-azure-external-transcript-click': 'onExternalTranscriptClicked',
                'click .js-skip-to-transcript': 'onSkipToTranscript'
            } : {
                'mousemove': 'onEnded',
                'mousemove': 'trackplayAMP',
                'click .azure__transcript-btn-inline': 'onToggleInlineTranscript',
                'click .js-azure-external-transcript-click': 'onExternalTranscriptClicked',
                'click .js-skip-to-transcript': 'onSkipToTranscript'
            }
        },

        initialize: function() {
            ComponentView.prototype.initialize.apply(this);

            _.bindAll(this, 'onInview', 'onPlay', 'onEnded' );

            /*if (window.onAzureIframeAPIReady === undefined) {
                window.onAzureIframeAPIReady = function() {
                    Adapt.azureAPIReady = true;
                    Adapt.trigger('azureAPIReady');
                };
                $.getScript('assets/www-widgetapi.js');
            }*/

            //FIREFOX CLOSED CAPTIONS SWITCH OF PLAYER
            _.delay(function() {
                const hlsSrc = this.model.get('_media')._source;
                const hlsCapLabel = this.model.get('_media')._caplabel;
                const hlsSrcLabel = this.model.get('_media')._srclang;
                const hlsCaptions = this.model.get('_media')._captions;
                const hlsCapkind = this.model.get('_media')._capkind;
                const hlsAutoplay = this.model.get('_media')._autoplay;
                const hlsFullscreen = this.model.get('_media')._setFullscreen;
                const hlsControls = this.model.get('_media')._controls;
                const hlsPoster = this.model.get('_media')._poster;
                const hlsScrubber = this.model.get('_media')._scrubber;
                const hlsCaptiononauto = this.model.get('_media')._captiononauto;

                if (navigator.userAgent.search("Firefox") >= 0) {
                    $('iframe[src*="assets/azure.htm"]').addClass("hlsfirefox").attr("src","assets/azure-ORIGINAL.htm?url=//" + hlsSrc + "&captions=" + hlsCapLabel + "," + hlsSrcLabel + ",//" + hlsCaptions + "&kind=" + hlsCapkind + "&autoplay=" + hlsAutoplay + "&fullscreen=" + hlsFullscreen + "&controls=" + hlsControls + "&poster=" + hlsPoster + "&scrubber=" + hlsScrubber + "&caponoff=" + hlsCaptiononauto);
                } else {
                    //do nothing
                }
            }.bind(this), 555);
        },

        preRender: function() {
            this.listenTo(Adapt, {
              'device:resize device:changed': this.setIFrameSize
            });
        },

        setIFrameSize: function () {
            //IF MOBILE ADD THE CLASS
            if ($('html').hasClass('touch')) {
                $('iframe').addClass("vjs-touch-enabled");
            } else {
                //DO NOTHING
            }
            this.$('.azuremediaplayer').width(this.$('.azure__widget').width());
            this.$('iframe').width(this.$('.azure__widget').width());
            
            var aspectRatio = (this.model.get("_media")._aspectRatio ? parseFloat(this.model.get("_media")._aspectRatio) : 1.778);//default to 16:9 if not specified
            if (!isNaN(aspectRatio)) {
                this.$('.azuremediaplayer').height(this.$('.azure__widget').width() / aspectRatio);
                this.$('iframe').height(this.$('.azure__widget').width() / aspectRatio);
            }
        },

        postRender: function() {
            //if (Adapt.azureAPIReady === true) {
                this.onAzureIframeAPIReady();
            /*} else {
                Adapt.once('azureAPIReady', this.onAzureIframeAPIReady, this)
            }*/
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
                    $(checkForChanges1);
                    if ( $('html').hasClass('accessibility') ) {
                        $(".js-skip-to-transcript").attr("tabindex", "0").attr("aria-label", "Skip to Transcript").text("Skip to Transcript");
                    }
                }
                var self = this;
                function checkForChanges1() {
                    if ($('.' + currentazureon + ' .azureplaymode').hasClass('vjs-has-started')) {
                        self.setCompletionStatus();
                    } else {
                        setTimeout(checkForChanges1, 500);
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
                    $(checkForChanges2);
                    if ( $('html').hasClass('accessibility') ) {
                        $(".js-skip-to-transcript").attr("tabindex", "0").attr("aria-label", "Skip to Transcript").text("Skip to Transcript");
                    }
                }
            }
            var self = this;
            function checkForChanges2() {
                if ($('.' + currentazureon + ' .azureendmode').hasClass('vjs-ended')) {
                    self.setCompletionStatus();
                } else {
                    setTimeout(checkForChanges2, 500);
                }
            }
        },

        trackplayAMP: function() {
            var currentazureon = this.model.get('_id');
            //Trigger PAUSE button from outside the iframe
            if ( $('iframe[name="azuremediaplayer-' + currentazureon + '"]').hasClass('vjs-playing') ) {
                $('div[data-adapt-id="' + currentazureon + '"] .audio-controls .audio-toggle.audio-pause:not(.audio-play)').trigger("click"); //stop current audio
                $('iframe:not(#' + currentazureon + ').vjs-playing:not(.vjs-paused)').contents().find(".vjs-play-control.vjs-control.vjs-button.vjs-playing:not(.vjs-paused)").trigger("click");
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
    
    Adapt.register('azure', {
      model: ComponentModel.extend({}), // register the model, it should be an extension of ComponentModel, an empty extension is fine
      view: Azure
    });

    return Azure;
});
