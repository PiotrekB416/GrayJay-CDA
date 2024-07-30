const PLATFORM = "CDA";

var config = {};

const VIDEO_SEARCH_URL = "api.cda.pl/video/search";
const VIDEO_URL = "www.cda.pl/video/";
const BASE_URL = "www.cda.pl";
const LOGIN = "{{login}}";
const PASSWORD = "{{password}}";
const REQUEST_PARAMS = {
    Accept: "application/vnd.cda.public+json",
}

const BASE_AUTH = "Basic NzdjMGYzYzUtMzZhMC00YzNkLWIwZDQtMGM0ZGZiZmQ1NmQ1Ok5wbU1MQldSZ3RFWDh2cDNLZjNkMHRhc0JwRnQwdHVHc3dMOWhSMHF0N2JRZGF4dXZER29jekZHZXFkNjhOajI";

function getToken() {
    let params = REQUEST_PARAMS;
    params["Authorization"] = BASE_AUTH;
    const res = http.POST(`https://api.cda.pl/oauth/token?grant_type=password&login=${encodeURI(LOGIN)}&password=${PASSWORD}`, "", params);

    if (res.code != 200) {
        return null;
    }

    return JSON.parse(res.body).access_token;
}

function id_from_username(username) {
    const jrpc = http.POST("https://www.cda.pl/api.php", JSON.stringify({
        "jsonrpc": "2.0",
        "method": "boxNoweFilmyGetPage",
        "params": [
            username,1,{}
        ],
        "id":1
    }), REQUEST_PARAMS);
    if (jrpc.code != 200) {
        return null;
    }

    const doc = JSON.parse(jrpc.body).result;
    if (!doc) {
        return null;
    }

    const v_id = domParser.parseFromString(doc, 'text/html').querySelector("a.thumbnail-link").getAttribute("href").replace("/video/","");

    const video = http.GET(`https://api.cda.pl/video/${v_id}`, REQUEST_PARAMS);
    if (video.code != 200) {
        return null;
    }

    return JSON.parse(video.body).video.author.id;
}
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
    console.log(`query: ${query}`);
    return getVideoPager(VIDEO_SEARCH_URL, {
        search: query,
        sort: order
    }, 1);
//	return new ContentPager([]. false);
};

source.getSearchChannelContentsCapabilities = function () {
	return {
		types: [Type.Feed.Mixed],
		sorts: [Type.Order.Chronological, "Views"],
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
    return url.includes(BASE_URL) && !url.includes(VIDEO_URL);
};
source.getChannel = function(url) {
    console.log(url);
    let author = url.replace("/vfilm", "").split("/").at(-1);
    author = id_from_username(author);
    let params = REQUEST_PARAMS;
    params["Authorization"] = "Bearer " + getToken();
    const res = http.GET("https://api.cda.pl/user/" + author, params);

    if (res.code != 200) {
        return null;
    }

    const data = JSON.parse(res.body);

    return new PlatformChannel({
        id: new PlatformID(PLATFORM, data.id, config.id),
        name: data.login,
        url: url,
        thumbnail: data.avatar,
        banner: data.header,
        subscribers: 0,
        description: "",
        links: null
    });
};
source.getChannelContents = function(url, type, order, filters) {
    console.log(url);
    let author = url.replace("/vfilm", "").split("/").at(-1);
    author = id_from_username(author);
    let params = REQUEST_PARAMS;
    params["Authorization"] = "Bearer " + getToken();
    if (order == "Views") {
        order = "popular";
    } else {
        order = "last";
    }

    return getVideoPager("https://api.cda.pl/user/" + author + "/videos", {
        sort: order
    }, 1);
};

source.getChannelPlaylists = function(url) {
    return getPlaylistPager(url, {
        token: getToken(),
        //author:
    }, []);
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

    let rating = new RatingLikes(0);
    if (data.premium) {
        rating = new RatingScaler(Number(data.imdb.average) / 10.);
    } else {
        rating = new RatingScaler(Number(data.rating) / 10.);
    }

    return new PlatformVideoDetails({
        id: new PlatformID(PLATFORM, data.id, config.id),
        name: data.title,
        url,
        author: new PlatformAuthorLink(new PlatformID(PLATFORM, data.author.id, config.id), data.author.login, `https://www.cda.pl/${data.author.login}`, data.author.avatar, ""),
        thumbnails: new Thumbnails([new Thumbnail(data.thumb)]),
        viewCount: data.views,
        duration: data.duration,
        rating,
        video: new VideoSourceDescriptor(data.qualities.map(quality => new VideoUrlSource({
            url: quality.file,
        }))),
    });
};

//Comments
source.getComments = function (url) {
    return getCommentsPager(url, {}, 1);
}

source.getSubComments = function (comment) {
	throw new ScriptException("This is a sample");
}

function getPlaylistVideos(path, params) {
    let r_params = REQUEST_PARAMS;
    r_params["Authorization"] = "Bearer " + params.token;
    const res = http.GET(path, r_params);

}

function getPlaylistPager(path, params, page) {
    path = path.replace("https://www.cda.pl", "https://api.cda.pl");
    path = path.replace("/vfilm", "");
    path += "/folders";
    const res = http.GET(path, REQUEST_PARAMS);

    if (res.code != 200) {
        return new ContentPager([], false);
    }

    let body = JSON.parse(res.body);

    let list = [new ]
}

function getVideoPager(path, params, page) {
    let url = "";

    if (params.search) {
        url = VIDEO_SEARCH_URL + "?query=" + encodeURI(params.search) + `&page=${page}&limit=20`;
        const res = http.GET(`https://${url}`, REQUEST_PARAMS);

        console.log(res.code);
        if (res.code != 200) {
            return new VideoPager([], false);
        }

        const data = JSON.parse(res.body);

        return new CDAVideoPager(data.data.map(video => {

            return new PlatformVideo({
                id: new PlatformID(PLATFORM, video.id, config.id),
                name: video.title,
                thumbnails: new Thumbnails([new Thumbnail(video.thumb)]),
                author: new PlatformAuthorLink(new PlatformID(PLATFORM, video.author.id, config.id), video.author.login, `https://www.cda.pl/${video.author.login}`, video.author.avatar, ""),
                uploadDate: 0,
                duration: video.duration,
                viewCount: video.views,
                url: "https://"+VIDEO_URL+video.id+"/vfilm",
                isLive: false
            });
        }), data.paginator.total_pages > page, path, params, page);
    } else {
        let token = getToken();
        if (token == null) {
            return new VideoPager([], false);
        }
        url = path + `?order=${params.sort}&page=${page}&limit=100`;
        let r_params = REQUEST_PARAMS;
        r_params["Authorization"] = "Bearer " + token;
        const res = http.GET(url, r_params);
        console.log(res.code);
        if (res.code != 200) {
            return new VideoPager([], false);
        }

        let author = path.replace("/videos", "");

        author = http.GET(author, r_params);
        if (author.code != 200) {
            return new VideoPager([], false);
        }

        return new CDAVideoPager(JSON.parse(res.body).data.map(video => {
            return new PlatformVideo({
                id: new PlatformID(PLATFORM, video.id, config.id),
                name: video.title,
                thumbnails: new Thumbnails([new Thumbnail(video.thumb)]),
                author: new PlatformAuthorLink(new PlatformID(PLATFORM, author.id, config.id), author.login, `https://www.cda.pl/${author.login}`, author.avatar, ""),
                uploadDate: video.published,
                duration: video.duration,
                viewCount: video.views,
                url: "https://"+VIDEO_URL+video.id+"/vfilm",
                isLive: false
            });
        }), JSON.parse(res.body).paginator.total_pages > page, path, params, page);
    }
}

function getCommentsPager(path, params, page) {
    let url = path.replace("www.cda.pl", "api.cda.pl").replace("/vfilm", `/comments?page=${page}`);
    if (!url.startsWith("https://")) {
        url = "https://" + url;
    }

    const res = http.GET(url, REQUEST_PARAMS);

    console.log(res.code);
    if (res.code != 200) {
        return new CommentPager([], false);
    }

    const data = JSON.parse(res.body);

    return new CDACommentPager(data.data.map(comment => {
        let reply_count = 0;

        if (comment.answers != null) {
            reply_count = comment.answers.length;
        }
        return new Comment({
            contextUrl: url,
            author: new PlatformAuthorLink(new PlatformID(PLATFORM, comment.author.id, config.id), comment.author.name, `https://www.cda.pl/${comment.author.login}`, comment.author.avatar, ""),
            message: comment.content,
            rating: new RatingLikes(Number(comment.rating)),
            date: comment.time,
            replyCount: reply_count
        });
    }), data.paginator.total_pages > page, url, params, page);
}

class CDAPlaylistPages extends PlaylistPager {
    constructor(results, hasMore, path, params, page) {
        super(results, hasMore, { path, params, page });
    }

    nextPage() {
        return getPlaylistPager(this.context.path, this.context.params, (this.context.page ?? 0) + 1);
    }
}

class CDAVideoPager extends VideoPager {
   constructor(results, hasMore, path, params, page) {
		super(results, hasMore, { path, params, page });
	}

	nextPage() {
		return getVideoPager(this.context.path, this.context.params, (this.context.page ?? 0) + 1);
	}
}

class CDACommentPager extends CommentPager {
    constructor(results, hasMore, path, params, page) {
        super(results, hasMore, { path, params, page });
    }

    nextPage() {
        return getCommentPager(this.context.path, this.context.params, (this.context.page ?? 0) + 1);
    }
}

console.log('LOADED')
