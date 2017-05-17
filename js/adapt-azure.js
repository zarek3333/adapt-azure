/*
* adapt-azure
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>, Matt Leathes <matt.leathes@kineo.com>
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

            _.bindAll(this, 'onPlayerStateChange', 'onPlayerReady', 'onInview');

            /* JAVASCRIPT FOR AZURE PLAYER <script src="https://amp.azure.net/libs/amp/1.7.4/azuremediaplayer.min.js"></script>*/
             //azuremediaplayer amp-default-skin vjs-controls-enabled vjs-playing vjs-has-started vjs-user-inactive
             //azuremediaplayer amp-default-skin vjs-controls-enabled vjs-has-started vjs-paused vjs-ended vjs-user-inactive

            /* $('.block').mousemove( function(){
                if ( $('#vidazure').hasClass('vjs-ended') ) {
                    //this.setCompletionStatus();
                    alert('ended');
                }
            }); */


            if (window.onYouTubeIframeAPIReady === undefined) {
                window.onYouTubeIframeAPIReady = function() {
                    console.info('YouTube iframe API loaded');
                    Adapt.youTubeIframeAPIReady = true;
                    Adapt.trigger('youTubeIframeAPIReady');
                };
                $.getScript('//www.youtube.com/iframe_api');
            }
        },

        preRender: function() {
            this.listenTo(Adapt, 'device:resize', this.setIFrameSize);
            this.listenTo(Adapt, 'device:changed', this.setIFrameSize);
        },

        setIFrameSize: function () {
            this.$('#vidazure').width(this.$('.azure-widget').width());
            
            var aspectRatio = (this.model.get("_media")._aspectRatio ? parseFloat(this.model.get("_media")._aspectRatio) : 1.778);//default to 16:9 if not specified
            if (!isNaN(aspectRatio)) {
                this.$('#vidazure').height(this.$('.azure-widget').width() / aspectRatio);
            }
        },

        postRender: function() {

            //ADD THE MIN.JS AND MIN.CSS TO THE THEME TO GET IT TO WORK
            /* JAVASCRIPT FOR AZURE PLAYER <script id="azurejs" src="https://amp.azure.net/libs/amp/1.8.3/azuremediaplayer.min.js"></script>*/
            //$( "script#azurejs" ).remove();
            //$( "head" ).append("<script id=\"azurejs\" src=\"https://amp.azure.net/libs/amp/1.8.3/azuremediaplayer.min.js\"></script>");

            /* CSS FOR AZURE PLAYER <link rel="stylesheet" id="azurecss" href="https://amp.azure.net/libs/amp/1.8.3/skins/amp-default/azuremediaplayer.min.css"> */
            //$( "link#azurecss" ).remove();
            //$( "head" ).append("<link rel=\"stylesheet\" id=\"azurecss\" href=\"https://amp.azure.net/libs/amp/1.8.3/skins/amp-default/azuremediaplayer.min.css\">");


            //FOR HTML/HBS Paramenters: https://developers.google.com/youtube/player_parameters
            if (Adapt.youTubeIframeAPIReady === true) {
                this.onYouTubeIframeAPIReady();
            } else {
                Adapt.once('youTubeIframeAPIReady', this.onYouTubeIframeAPIReady, this)
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
            }

            // add listener for other youtube components on the page, so that we can prevent multiple video playback
            this.listenTo(Adapt, 'adapt-azure:playbackstart', this.onYouTubePlaybackStart)
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

        onYouTubeIframeAPIReady: function() {
            //console.info('onYouTubeIframeAPIReady');
        /* this.player = new YT.Player(this.$('#vidazure').get(0), {
                events: {
                    'onStateChange': this.onPlayerStateChange,
                    'onReady': this.onPlayerReady
                }
            }); */

            _.delay(function() {
                $(window).resize();
            }, 10);

            this.onPlayerStateChange;

            this.onPlayerReady;

            this.isPlaying = false;
            
            this.setReadyStatus();
            
            this.setupEventListeners();
            
            this.setIFrameSize();
        },

        /**
        * if another YouTube video starts playback whilst this one is playing, pause this one.
        * prevents user from playing multiple videos on the page at the same time
        */
        onYouTubePlaybackStart: function(component) {
            if(component != this && this.isPlaying) {
                this.player.pauseVideo();
            }
        },

        onPlayerReady: function() {
            if (this.model.get("_media")._playbackQuality) {
                this.player.setPlaybackQuality(this.model.get("_media")._playbackQuality);
            }
        },

        /**
        * this seems to have issues in Chrome if the user is logged into YouTube (possibly any Google account) - the API just doesn't broadcast the events
        * but instead throws the error:
        * Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://www.youtube.com') does not match the recipient window's origin ('http://www.youtube.com').
        * This is documented here:
        *   https://code.google.com/p/gdata-issues/issues/detail?id=5788
        * but I haven't managed to get any of the workarounds to work... :-(
        */
        onPlayerStateChange: function(event) {
            switch(event.data) {
                case YT.PlayerState.PLAYING:
                    Adapt.trigger('adapt-azure:playbackstart', this);
                    
                    this.isPlaying = true;

                    if(this.model.get('_setCompletionOn') && this.model.get('_setCompletionOn') === "play") {
                        this.setCompletionStatus();
                    }
                break;
                case YT.PlayerState.PAUSED:
                    this.isPlaying = false;
                break;
                case YT.PlayerState.ENDED:
                    if(this.model.get('_setCompletionOn') && this.model.get('_setCompletionOn') === "ended") {
                        this.setCompletionStatus();
                    }
                break;
            }
            //console.log("this.onPlayerStateChange: " + this.isPlaying);
        }
    },
    {
        template: 'azure'
    });
    
    Adapt.register("azure", azure );

    return azure;
});
