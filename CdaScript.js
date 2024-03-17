const PLATFORM = "CDA";

var config = {};

const VIDEO_SEARCH_URL = "www.cda.pl/video/show/";
const VIDEO_URL = "www.cda.pl/video/";

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
	throw new ScriptException("This is a sample");
};
source.getContentDetails = function(url) {
	throw new ScriptException("This is a sample");
};

//Comments
source.getComments = function (url) {
	throw new ScriptException("This is a sample");

}
source.getSubComments = function (comment) {
	throw new ScriptException("This is a sample");
}

function getVideoPager(path, params, page) {
    const url = VIDEO_SEARCH_URL + params.search.replace(/ /g, "_") + `/p${page}?s=best`;
    const res = http.GET(url, {});

    if (res.code != 200) {
        return new VideoPager([], false);
    }
    const parser = new DOMParser();

    const html = parser.parseFromString(res.body, "text/html");
    const durationsConvert = [3600, 60, 1];

    return new CDAVideoPager(html.querySelectorAll(".video-clip-wrapper").map(video => {
        const videoHref = video.querySelector("a.link-title-visit");
        const videoID = videoHref.href.replace(`https://${VIDEO_URL}/`, "").replace("/vfilm", "");
        const durationArray = video.querySelector("span.timeElem").innerText.split(":");
        let duration = 0;
        for (i = durationArray.length - 1; i >= 0; i--) {
            duration += durationArray[i] * durationsConvert[i];
        }

        return new PlatformVideo({
            id: new PlatformID(PLATFORM, videoID, config.id),
            name: videoHref.innerText,
            thumbnails: new Thumbnails([new Thumbnail(video.querySelector("img").src , 0)]),
            author: new PlatformAuthorLink(new PlatformID(PLATFORM, "", config.id), "", "", ""),
            uploadDate: 0,
            duration,
            viewCount: 0,
            url: videoHref.href,
            isLive: false
        });
    }), false, url, params, page);
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
