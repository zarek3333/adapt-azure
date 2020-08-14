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
        events: {
            "click .azure__transcript-btn-inline": "onToggleInlineTranscript",
            "click .js-skip-to-transcript": "onSkipToTranscript"
        },

        initialize: function() {
            ComponentView.prototype.initialize.apply(this);

            _.bindAll(this, 'onInview', 'onPlay', 'onEnded' );

            /* CSS FOR AZURE PLAYER <link rel="stylesheet" href="//amp.azure.net/libs/amp/1.8.3/skins/amp-default/azuremediaplayer.min.css"> */
            /* JAVASCRIPT FOR AZURE PLAYER <script src="//amp.azure.net/libs/amp/1.8.3/azuremediaplayer.min.js"></script>*/

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
            this.$('.azure__transcript-container button').a11y_focus();
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
                    if ( $('.' + currentazureon + ' .azureendmode').hasClass('vjs-ended')) {
                        this.setCompletionStatus();
                    }
                }
            }
        },
        
        onToggleInlineTranscript: function(event) {
            if (event) event.preventDefault();
            var $transcriptBodyContainer = this.$(".azure__transcript-body-inline");
            var $button = this.$(".azure__transcript-btn-inline");

            if ($transcriptBodyContainer.hasClass("inline-transcript-open")) {
                $transcriptBodyContainer.slideUp(function() {
                    $(window).resize();
                });
                $transcriptBodyContainer.removeClass("inline-transcript-open");
                $button.html(this.model.get("_transcript").inlineTranscriptButton);
            } else {
                $transcriptBodyContainer.slideDown(function() {
                    $(window).resize();
                }).a11y_focus();
                $transcriptBodyContainer.addClass("inline-transcript-open");
                $button.html(this.model.get("_transcript").inlineTranscriptCloseButton);
                if (this.model.get('_transcript')._setCompletionOnView !== false) {
                    this.setCompletionStatus();
                }
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
