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
	throw new ScriptException("This is a sample");
};
source.getContentDetails = function(url) {
	const res = http.GET(url, {});

    if (res.code != 200) {
        return null;
    }

    const html = domParser.parseFromString(res.body.substring(res.body.indexOf("<body"), res.body.lastIndexOf("</body>") + 7));

    return new PlatformVideoDetails({
        id: new PlatformID(PLATFORM, url.replace(`https://${VIDEO_URL}`, "").replace("/vfilm", ""), config.id),
        name: html.querySelector("#naglowek").text,
        url,
        video: new VideoSourceDescriptor([new VideoUrlSource({
            url: html.querySelector("video").getAttribute("src"),
            container: "video/mp4",
        })]),
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
    const url = VIDEO_SEARCH_URL + params.search.replace(/ /g, "_") + `/p${page}?s=best`;
    const res = http.GET(`https://${url}`, {});

    //log(res);
    if (res.code != 200) {
        return new VideoPager([], false);
    }
    //const parser = new DOMParser();

    const html = domParser.parseFromString(res.body.substring(res.body.indexOf("<body"), res.body.lastIndexOf("</body>") + 7));;

    const durationsConvert = [3600, 60, 1];
    return new CDAVideoPager(html.querySelectorAll(".video-clip-wrapper").map(video => {
        const videoHref = video.querySelector("a.link-title-visit");
        const videoID = videoHref.getAttribute("href").replace(`https://${VIDEO_URL}`, "").replace("/vfilm", "");
        const durationArray = video.querySelector("span.timeElem").text.split(":");
        let duration = 0;
        log(durationArray);
        for (let i = 1; i <= durationArray.length; i++) {
            duration += durationArray[durationArray.length - i] * durationsConvert[3-i];
        }

        const imgSrc = video.querySelector("img").getAttribute("src");

        return new PlatformVideo({
            id: new PlatformID(PLATFORM, videoID, config.id),
            name: videoHref.text,
            thumbnails: new Thumbnails([new Thumbnail("https:" + imgSrc , 0)]),
            author: new PlatformAuthorLink(new PlatformID(PLATFORM, "", config.id), "", "", ""),
            uploadDate: 0,
            duration,
            viewCount: 0,
            url: "https://"+VIDEO_URL+videoID+"/vfilm",
            isLive: false
        });
    }), html.querySelectorAll(".sbmNext").length > 0, url, params, page);
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
