/*
* adapt-azure
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Mike Stevens <mesgraphix@gmail.com>
*/

define(function(require) {

    var ComponentView = require('coreViews/componentView');
    var Adapt = require('coreJS/adapt');
    //var azuremediaplayer  = $.getScript('//amp.azure.net/libs/amp/1.8.3/azuremediaplayer.min.js');

    var azure = ComponentView.extend({
        defaults:function() {
            return {
                player:null
            }
        },

        initialize: function() {
            ComponentView.prototype.initialize.apply(this);

            _.bindAll(this, 'onPlayerReady', 'onInview', 'onEnded' );

            /* CSS FOR AZURE PLAYER <link rel="stylesheet" id="azurecss" href="//amp.azure.net/libs/amp/1.8.3/skins/amp-default/azuremediaplayer.min.css"> */
            $( "link#azurecss" ).remove();
            $( "body" ).append("<link rel=\"stylesheet\" id=\"azurecss\" href=\"//amp.azure.net/libs/amp/1.8.3/skins/amp-default/azuremediaplayer.min.css\">");

            /* JAVASCRIPT FOR AZURE PLAYER <script src="//amp.azure.net/libs/amp/1.8.3/azuremediaplayer.min.js"></script>*/
            $('.block').mousemove( function(){
                $('.vjs-has-started.vjs-playing.vjs-user-active').addClass('azurend');
                if ( $('.azuremediaplayer').hasClass('vjs-user-active')) {
                    $('.vjs-has-started.vjs-user-inactive.vjs-playing .vjs-play-control.vjs-playing').trigger( "click" );
                }
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
            this.$('.amp-default-skin').width(this.$('.azure-widget').width());
            
            var aspectRatio = (this.model.get("_media")._aspectRatio ? parseFloat(this.model.get("_media")._aspectRatio) : 1.778);//default to 16:9 if not specified
            if (!isNaN(aspectRatio)) {
                this.$('.amp-default-skin').height(this.$('.azure-widget').width() / aspectRatio);
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
                this.player.destroy();
            }

            ComponentView.prototype.remove.call(this);
        },
    
        setupEventListeners: function() {
            this.completionEvent = (!this.model.get('_setCompletionOn')) ? 'play' : this.model.get('_setCompletionOn');
            if (this.completionEvent === "inview") {
                this.$('.azure-widget').on('inview', this.onInview);
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
        
        onEnded: function(event, visible2, visiblePartX2, visiblePartY2) {
            if (visible2) {
                if (visiblePartY2 === 'top') {
                    this._isVisibleTop = true;

                } else if (visiblePartY2 === 'bottom') {
                    this._isVisibleBottom = true;
                } else {
                    this._isVisibleTop = true;
                    this._isVisibleBottom = true;
                }

                if (this._isVisibleTop && this._isVisibleBottom) {
                    if ( $('.azuremediaplayer').hasClass('azurend')) {
                        this.$('.component-inner').off('inview');
                        this.setCompletionStatus();
                        $('.azuremediaplayer').removeClass('azurend');
                    }
                }
            }
        },

        onYouTubeIframeAPIReady: function() {

            _.delay(function() {
                $(window).resize();
            }, 250);

            this.onPlayerReady;

            this.isPlaying = false;
            
            this.setReadyStatus();
            
            this.setupEventListeners();
            
            this.setIFrameSize();
        },

        onPlayerReady: function() {
            if (this.model.get("_media")._playbackQuality) {
                this.player.setPlaybackQuality(this.model.get("_media")._playbackQuality);
            }
        }

    },
    {
        template: 'azure'
    });
    
    Adapt.register("azure", azure );

    return azure;
});
