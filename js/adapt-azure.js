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

        initialize: function() {
            ComponentView.prototype.initialize.apply(this);

            _.bindAll(this, 'onInview', 'onPlay', 'onEnded' );

            /* CSS FOR AZURE PLAYER <link rel="stylesheet" id="azurecss" href="//amp.azure.net/libs/amp/1.8.3/skins/amp-default/azuremediaplayer.min.css"> */
            /* JAVASCRIPT FOR AZURE PLAYER <script src="//amp.azure.net/libs/amp/1.8.3/azuremediaplayer.min.js"></script>*/
            $('.block').mousemove( function(){
                $('.vjs-has-started.vjs-playing.vjs-user-active').addClass('azurend');
                if ( $('.azuremediaplayer').hasClass('vjs-user-active')) {
                    $('.vjs-has-started.vjs-user-inactive.vjs-playing .vjs-play-control.vjs-playing').trigger( "click" );
                };
            });
            //MOBILE TABLET VERSION
            $('.block').bind('touchmove', function (e){
                $('.vjs-has-started.vjs-playing.vjs-user-active').addClass('azurend');
                if ( $('.azuremediaplayer').hasClass('vjs-user-active')) {
                    $('.vjs-has-started.vjs-user-inactive.vjs-playing .vjs-play-control.vjs-playing').trigger( "click" );
                }
            });

            if (window.onYouTubeIframeAPIReady === undefined) {
                window.onYouTubeIframeAPIReady = function() {
                    Adapt.azureAPIReady = true;
                    Adapt.trigger('azureAPIReady');
                };
                $.getScript('//rawgit.com/mike-st/adapt-azure/master/js/www-widgetapi.js');
            }
        },

        preRender: function() {
            this.listenTo(Adapt, 'device:resize', this.setIFrameSize);
            this.listenTo(Adapt, 'device:changed', this.setIFrameSize);
        },

        setIFrameSize: function () {
            if(!!navigator.userAgent.match(/Trident.*rv\:11\./) || navigator.userAgent.match('MSIE 10.0;')) { //IE11 or IE10 check or not
                //IE NO NEED FOR WINDOW RESIZE FUNCTION
            } else {
                $(window).resize();
            }
            
            this.$('.amp-default-skin').width(this.$('.azure-widget').width());
            this.$('iframe').width(this.$('.azure-widget').width());
            
            var aspectRatio = (this.model.get("_media")._aspectRatio ? parseFloat(this.model.get("_media")._aspectRatio) : 1.778);//default to 16:9 if not specified
            if (!isNaN(aspectRatio)) {
                this.$('.amp-default-skin').height(this.$('.azure-widget').width() / aspectRatio);
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

                if (this._isVisibleTop && this._isVisibleBottom) {
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

                if (this._isVisibleTop && this._isVisibleBottom) {
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

                if (this._isVisibleTop && this._isVisibleBottom) {
                    if ( $('.vjs-ended').is('.azurend')) {
                        this.$('.vjs-has-started.vjs-paused.vjs-ended').off('inview').removeClass('azurend');
                        this.setCompletionStatus();
                    }
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
