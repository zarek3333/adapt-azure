/*
* adapt-azure
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Mike Stevens <mesgraphix@gmail.com>
*/

define(function(require) {

    var ComponentView = require('coreViews/componentView');
    var Adapt = require('coreJS/adapt');

    var azure = ComponentView.extend({
        defaults:function() {
            return {
                player:null
            }
        },
        events: {
            "click .azure-inline-transcript-button": "onToggleInlineTranscript"
        },

        initialize: function() {
            ComponentView.prototype.initialize.apply(this);

            _.bindAll(this, 'onInview', 'onPlay', 'onEnded' );

            /* CSS FOR AZURE PLAYER <link rel="stylesheet" href="//amp.azure.net/libs/amp/1.8.3/skins/amp-default/azuremediaplayer.min.css"> */
            /* JAVASCRIPT FOR AZURE PLAYER <script src="//amp.azure.net/libs/amp/1.8.3/azuremediaplayer.min.js"></script>*/

            if (window.onYouTubeIframeAPIReady === undefined) {
                window.onYouTubeIframeAPIReady = function() {
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
            this.$('.azuremediaplayer').width(this.$('.azure-widget').width());
            this.$('iframe').width(this.$('.azure-widget').width());
            
            var aspectRatio = (this.model.get("_media")._aspectRatio ? parseFloat(this.model.get("_media")._aspectRatio) : 1.778);//default to 16:9 if not specified
            if (!isNaN(aspectRatio)) {
                this.$('.azuremediaplayer').height(this.$('.azure-widget').width() / aspectRatio);
                this.$('iframe').height(this.$('.azure-widget').width() / aspectRatio);
            }
        },

        postRender: function() {

            if (Adapt.azureAPIReady === true) {
                this.onYouTubeIframeAPIReady();
            } else {
                Adapt.once('azureAPIReady', this.onYouTubeIframeAPIReady, this)
            }
        },

        remove: function() {
            if(this.player != null) {
                this.player.dispose();
            }

            ComponentView.prototype.remove.call(this);
        },
    
        setupEventListeners: function() {
            this.completionEvent = (!this.model.get('_setCompletionOn')) ? 'play' : this.model.get('_setCompletionOn');
            if (this.completionEvent === "inview") {
                this.$('.azure-widget').on('inview', this.onInview);
            } else if (this.completionEvent === "play") {
                this.$('.azure-widget').on('inview', this.onPlay);
            } else if (this.completionEvent === "ended") {
                this.$('.azure-widget').on('inview', this.onEnded);
            }
        },

        onInview: function(event, visible, visiblePartX, visiblePartY) {
            if (visible) {
                if (visiblePartY === 'top') {
                    this._isVisibleTop = true;
                } else if (visiblePartY === 'bottom') {
                    this._isVisibleBottom = true;
                } else {
                    this._isVisibleTop = true;
                    this._isVisibleBottom = true;
                }

                $('.block .azuremediaplayer').each(function(index) {
                    $(this).on("click", function(){
                        $(this).addClass('azurend').stop();
                    });
                });

                if (this._isVisibleTop && this._isVisibleBottom) {
                    $('.azurend.vjs-user-inactive .vjs-play-control.vjs-playing').trigger( "click" );
                    this.$('.component-inner').off('inview');
                    this.setCompletionStatus();
                }
            }
        },
        
        onPlay: function(event, visible, visiblePartX, visiblePartY) {
            if (visible) {
                if (visiblePartY === 'top') {
                    this._isVisibleTop = true;
                } else if (visiblePartY === 'bottom') {
                    this._isVisibleBottom = true;
                } else {
                    this._isVisibleTop = true;
                    this._isVisibleBottom = true;
                }

                $('.block .azuremediaplayer').each(function(index) {
                    $(this).on("click", function(){
                        $(this).addClass('azurend').stop();
                    });
                });

                if (this._isVisibleTop && this._isVisibleBottom) {
                    $('.azurend .vjs-play-control.vjs-playing').trigger( "click" );
                    if ( $('.azurend').is('.vjs-has-started') ) {
                        this.$('.azuremediaplayer').off('inview').removeClass('azurend');
                        this.setCompletionStatus();
                    }
                }
            }
        },
        
        onEnded: function(event, visible, visiblePartX, visiblePartY) {
            if (visible) {
                if (visiblePartY === 'top') {
                    this._isVisibleTop = true;

                } else if (visiblePartY === 'bottom') {
                    this._isVisibleBottom = true;
                } else {
                    this._isVisibleTop = true;
                    this._isVisibleBottom = true;
                }

                $('.block .azuremediaplayer').each(function(index) {
                    $(this).on("click", function(){
                        $(this).addClass('azurend').stop();
                    });
                });

                if (this._isVisibleTop && this._isVisibleBottom) {
                    $('.azurend .vjs-play-control.vjs-playing').trigger( "click" );
                    if ( $('.vjs-ended').is('.azurend')) {
                        this.$('.vjs-has-started.vjs-paused.vjs-ended').off('inview').removeClass('azurend');
                        this.setCompletionStatus();
                    }
                }
            }
        },
        
        onToggleInlineTranscript: function(event) {
            if (event) event.preventDefault();
            var $transcriptBodyContainer = this.$(".azure-inline-transcript-body-container");
            var $button = this.$(".azure-inline-transcript-button");

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

        onYouTubeIframeAPIReady: function() {

            this.isPlaying = false;
            
            this.setReadyStatus();
            
            this.setupEventListeners();
            
            this.setIFrameSize();
        }

    },
    {
        template: 'azure'
    });
    
    Adapt.register("azure", azure );

    return azure;
});
