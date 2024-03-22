const PLATFORM = "CDA";

var config = {};

const VIDEO_SEARCH_URL = "api.cda.pl/video/search";
const VIDEO_URL = "www.cda.pl/video/";
const API_VIDEO_URL = "api.cda.pl/video/";
const REQUEST_PARAMS = {
    Accept: "application/vnd.cda.public+json",
};

//Source Methods
source.enable = function(conf, settings, savedState){
	config = conf ?? {};
}
source.getHome = function() {
	return new ContentPager([], false);
};

source.searchSuggestions = function(query) {
	throw new ScriptException("This is a sample");
};
source.getSearchCapabilities = () => {
	return {
		types: [Type.Feed.Mixed],
		sorts: [Type.Order.Chronological],
		filters: [ ]
	};
};
source.search = function (query, type, order, filters) {
    log(`query: ${query}`);

    return getVideoPager(VIDEO_SEARCH_URL, {
        search: query,
        sort: order
    }, 0);
//	return new ContentPager([]. false);
};

source.getSearchChannelContentsCapabilities = function () {
	return {
		types: [Type.Feed.Mixed],
		sorts: [Type.Order.Chronological],
		filters: []
	};
};
source.searchChannelContents = function (channelUrl, query, type, order, filters) {
	throw new ScriptException("This is a sample");
};

source.searchChannels = function (query) {
	throw new ScriptException("This is a sample");
};

//Channel
source.isChannelUrl = function(url) {
	throw new ScriptException("This is a sample");
};
source.getChannel = function(url) {
	throw new ScriptException("This is a sample");
};
source.getChannelContents = function(url) {
	throw new ScriptException("This is a sample");
};

//Video
source.isContentDetailsUrl = function(url) {
    return url.includes(VIDEO_URL) && !url.includes(VIDEO_SEARCH_URL);
};

source.getContentDetails = function(url) {
    const res = http.GET(url.replace("https://www.cda.pl", "https://api.cda.pl").replace("/vfilm", ""), REQUEST_PARAMS);

    if (res.code != 200) {
        return null;
    }

    const data = JSON.parse(res.body).video;

    return new PlatformVideoDetails({
        id: new PlatformID(PLATFORM, data.id, config.id),
        name: data.title,
        url,
        author: new PlatformAuthorLink(new PlatformID(PLATFORM, "", config.id), "", "", ""),
        thumbnails: new Thumbnails([new Thumbnail(data.thumb)]),
        viewCount: data.views,
        duration: data.duration,
        video: new VideoSourceDescriptor(data.qualities.map(quality => new VideoUrlSource({
            url: quality.file,
        }))),
    });
};

//Comments
source.getComments = function (url) {
	throw new ScriptException("This is a sample");

}
source.getSubComments = function (comment) {
	throw new ScriptException("This is a sample");
}

function getVideoPager(path, params, page) {
    const url = VIDEO_SEARCH_URL + "?query=" + encodeURI(params.search) + `&page=${page}&limit=20`;
    const res = http.GET(`https://${url}`, REQUEST_PARAMS);

    log(res.code);
    if (res.code != 200) {
        return new VideoPager([], false);
    }

    const data = JSON.parse(res.body);
    //const parser = new DOMParser();

    return new CDAVideoPager(data.data.map(video => {
        return new PlatformVideo({
            id: new PlatformID(PLATFORM, video.id, config.id),
            name: video.title,
            thumbnails: new Thumbnails([new Thumbnail(video.thumb)]),
            author: new PlatformAuthorLink(new PlatformID(PLATFORM, "", config.id), "", "", ""),
            uploadDate: 0,
            duration: video.duration,
            viewCount: video.views,
            url: "https://"+VIDEO_URL+video.id+"/vfilm",
            isLive: false
        });
    }), data.paginator.totalPages > page, url, params, page);
}

class CDAVideoPager extends VideoPager {
   constructor(results, hasMore, path, params, page) {
		super(results, hasMore, { path, params, page });
	}

	nextPage() {
		return getVideoPager(this.context.path, this.context.params, (this.context.page ?? 0) + 1);
	}
}

log("LOADED");
