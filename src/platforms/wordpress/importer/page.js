const notify = require('../../../helpers/notify');
const connect = require('../helpers/connect');
const convertHelper = require('../helpers/convert');
const pageContentType = require('../../../content-type-definitions/contentType5.json');
const authorContentType = require('../../../content-type-definitions/contentType1.json');
const {flotiq} = require('../../../helpers/flotiq');

exports.importer = async (apiKey, wordpressUrl, mediaArray) => {
    console.log('Importing pages to Flotiq');
    let perPage = 25;
    let page = 1;
    let totalPages = 1;
    let totalCount = 1;
    let imported = 0;
    let pagesWithParent = [];

    for(page; page <= totalPages; page++) {
        let wordpressResponse = await connect.wordpress(wordpressUrl, perPage, page, totalPages, 'pages');
        totalPages = wordpressResponse.totalPages;
        totalCount = wordpressResponse.totalCount;

        let responseJson = wordpressResponse.responseJson;
        let pagesConverted = [];
        responseJson.map(async (page) => {
            pagesConverted.push(convert(page, mediaArray));
            if(page.parent) {
                pagesWithParent.push(convert2(page, mediaArray));
            }
        })
        let result = await flotiq(apiKey, pageContentType.name, pagesConverted);
        let json;
        let text;
        try{
            text = await result.text()
            console.log(text);
            json = JSON.parse(text);

        } catch (e) {
            console.log(text);
        }
        if(json && json.batch_success_count && json.errors.length === 0){
            imported+=json.batch_success_count;
        }


        notify.resultNotify(result, 'Pages from page', page, json);

        console.log('Pages progress: ' + imported + '/' + totalCount);

    }
    if(pagesWithParent.length) {
        page = 0;
        imported = 0;
        totalPages = Math.ceil(pagesWithParent.length/25);
        for(page; page < totalPages; page++) {
            let result = await flotiq(apiKey, pageContentType.name, pagesWithParent.slice(page*25,(page+1)*25));
            let json;
            let text;
            try {
                text = await result.text();
                json = JSON.parse(text);
            } catch (e) {
                console.log(text);
            }
            notify.resultNotify(result, 'Pages with parents from page', page, json);
            imported++;
            console.log('Updating pages parents progress: ' + imported + '/' + pagesWithParent.length);
        }
    }

    function convert(page, mediaArray) {
        let content = convertHelper.convertContent(page.content.rendered, mediaArray);
        
        // Add placeholder if featured media is not available
        if (page.featured_media && !mediaArray[page.featured_media]) {
            content += '\n\n[Placeholder Image - Featured image was not uploaded]';
        }
        
        return {
            id: pageContentType.name + '_' + page.id,
            slug: page.slug,
            title: page.title.rendered,
            status: page.status,
            created: page.date,
            modified: page.modified,
            content: content,
            author: [{
                type: 'internal',
                dataUrl: '/api/v1/content/' + authorContentType.name + '/' + authorContentType.name + '_' + page.author
            }],
            featuredMedia: page.featured_media && mediaArray[page.featured_media] ? [{
                type: 'internal',
                dataUrl: '/api/v1/content/_media/' + mediaArray[page.featured_media].id
            }] : []

        }
    }
    function convert2(page, mediaArray) {
        return {
            ...convert(page, mediaArray),
            parentPage: page.parent ? [{
                type: 'internal',
                dataUrl: '/api/v1/content/' + pageContentType.name + '/' + pageContentType.name + '_' + page.parent
            }] : []
        }
    }
}
