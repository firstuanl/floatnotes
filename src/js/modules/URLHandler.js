EXPORTED_SYMBOLS = ['URLParser', 'URLHandler'];

Components.utils.import("resource://floatnotes/preferences.jsm");

var URLParser = {
    getProtocol: function(location) {
        return location.protocol ? location.protocol : '';
    },
    getAllSitesUrl: function(location) {
        return '*';
    },
    getPageUrl: function(location) {
        return '';
    },
    getPageQueryUrl: function(location) {
        return '';  
    },
    getPageAnchorUrl: function(location) {
        return '';
    },
    getSiteUrl: function(location) {
        return '';
    },
    getStartsWithUrls: function(location) {
        return [];
    },
    getDefaultUrl: function(location) {
        var def = Preferences.location;
        var url = '';
        switch(def) {
           case  URLHandler.PAGE_ANCHOR_URL:
               url = this.getPageAnchorUrl(location);
                if(url) {
                    break;
                }
           case URLHandler.PAGE_QUERY_URL:
               url = this.getPageQueryUrl(location);
                if(url) {
                    break; 
                }
           case URLHandler.PAGE_URL:
               url = this.getPageUrl(location);
                break;
           case URLHandler.PAGE_WILDCARD_URL:
               var urls = this.getStartsWithUrls(location);
                url = urls[urls.length - 1];
                break;
           case URLHandler.SITE_URL:
                url = this.getSiteUrl(location);
                break;
           default:
               url = this.getPageUrl(location);
        }
        if(!url) {
           url = this.getPageUrl(location);
        }
        return url;
    },
    getSearchUrls: function(location) {
        return [];
    }
};

var URLHandler = {
    PAGE_URL: -2,
    PAGE_QUERY_URL: -1,
    PAGE_ANCHOR_URL: -4,
    PAGE_WILDCARD_URL: -3,
    SITE_URL: 0,
    _parsers: {},
    _isProtocolSupported: function(location) {
        return (typeof this._parsers[location.protocol] != 'undefined');
    },
    register: function(protocol, parser) {
        if(protocol instanceof Array) {
            for(var i = protocol.length;i--;) {
                this._parsers[protocol[i]] = parser;
            }
        }
        else {
            this._parsers[protoco] = parser;
        }
    },

    supports: function(location) {
        return location.protocol in this._parsers;
    }
};

for(var method in URLParser) {
    if(URLParser.hasOwnProperty(method)) {
        URLHandler[method] = (function(method) {
             return function(location) {
                if(this._isProtocolSupported(location)) {
                    var parser =  this._parsers[location.protocol];
                    return parser[method].call(parser, location);
                }
                return false;
             };
        }(method));
    }
}

var HTTPURLParser = {
    __proto__: URLParser,
    getPageUrl: function(location) {
        var pathname =  location.pathname;
        if(pathname.charAt(pathname.length-1) == '/') {
            pathname = pathname.substring(0, pathname.length-1);
        }
        return location.hostname + pathname;
    },
    getPageQueryUrl: function(location) {
        if(location.search) {
            return location.hostname + location.pathname + location.search;
        }
        return '';
    },
    getPageAnchorUrl: function(location) {
        if(location.hash && Preferences.updateOnHashChange) {
            return location.hostname + location.pathname + location.search + location.hash;
        }
        return '';
    },
    getSiteUrl: function(location) {
        return location.hostname + '*'; 
    },
    getStartsWithUrls: function(location) {
        var urls = [];
        var parts = location.pathname.split('/');
        parts.shift();
        var path = location.hostname;
        if(parts[parts.length-1] === '') {
            parts.pop();
        }
        for (var i = 0, length = parts.length; i < length; ++i) {
            path += '/' + parts[i];
            urls.push(path + '*');
        }
        return urls;
    },
    getSearchUrls: function(location) {
        var urls = this.getStartsWithUrls(location);
        urls.push(this.getAllSitesUrl(location));
        urls.push(this.getSiteUrl(location));
        var includePageUrl = !location.hash || !Preferences.updateOnHashChange || Preferences.includePageForHashURLs;
        if(includePageUrl) {
            urls.push(this.getPageUrl(location));
        }
        if(location.search && includePageUrl) {
            urls.push(this.getPageQueryUrl(location));
        }
        if(location.hash && Preferences.updateOnHashChange) {
            urls.push(this.getPageAnchorUrl(location));
        }
        return urls;
    }
};

URLHandler.register(['http:', 'https:'], HTTPURLParser);
