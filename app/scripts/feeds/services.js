'use strict';

angular.module('feeds-services', []).factory('feedService', ['$q', '$sce', 'feedStorage', function ($q, $sce, feedStorage) {

        function sanitizeFeedEntry(feedEntry) {
            feedEntry.feedTitle = $sce.trustAsHtml(feedEntry.title);
            feedEntry.feedContentSnippet = $sce.trustAsHtml(feedEntry.contentSnippet);
            return feedEntry;
        }

        var getFeeds = function (src) {
            var deferred = $q.defer();

            var feed = new google.feeds.Feed(src);
//            feed.includeHistoricalEntries();
//            feed.setNumEntries($routeParams.count);

            function extractFeedAttributes(feedEntry) {
                var thumbnail = $(feedEntry.content).find('img').first();
                if (!thumbnail.attr('src')) {
                    feedEntry.feedThumbnailSrc = 'app/images/th-not-available.jpg';
                }
                else {
                    feedEntry.feedThumbnailSrc = 'http:' + thumbnail.attr('src');
                }
                sanitizeFeedEntry(feedEntry);
            }

            feed.load(function (response) {
                if (response.error) {
                    console.error('###### response.error = ' + JSON.stringify(response.error));
                    deferred.reject(response.error);
                }
                else {
                    for (var i = 0; i < response.feed.entries.length; i++) {
                        extractFeedAttributes(response.feed.entries[i]);
                    }
                    deferred.resolve(response.feed.entries);
                }
            });
            return deferred.promise;
        };

        return {
            getFeeds: getFeeds
        };
    }])
    .factory('feedStorage', function () {
        var CACHE_INTERVAL = 1000 * 60 * 15; //15 minutes

        function cacheTimes() {
            if ('CACHE_TIMES' in localStorage) {
                return angular.fromJson(localStorage['CACHE_TIMES']);
            }
            return {};
        }

        function hasCache(name) {
            var CACHE_TIMES = cacheTimes();
            return name in CACHE_TIMES && name in localStorage && new Date().getTime() - CACHE_TIMES[name] < CACHE_INTERVAL;
        }

        return {
            setValue: function (key, value) {
                if (window.Android) {
                    window.Android.setValue(key, angular.toJson(value));
                }
                else {
                    localStorage[key] = angular.toJson(value);
                }
            },
            getValue: function (key, defaultValue) {
                if (window.Android) {
                    var value = window.Android.getValue(key, defaultValue);
                    if (!value || value === 'undefined') {
                        return defaultValue
                    }
                    return angular.fromJson(value);
                }
                else if (localStorage[key] != undefined) {
                    return angular.fromJson(localStorage[key]);
                }
                return defaultValue ? defaultValue : null;
            },
            setCache: function (name, obj) {
                localStorage[name] = angular.toJson(obj);
                var CACHE_TIMES = cacheTimes();
                CACHE_TIMES[name] = new Date().getTime();
                localStorage['CACHE_TIMES'] = angular.toJson(CACHE_TIMES);
            },
            getCache: function (name) {
                if (hasCache(name)) {
                    return angular.fromJson(localStorage[name]);
                }
                return null;
            },
            hasCache: hasCache
        };
    });