const notify = require('../../../helpers/notify');
const connect = require('../helpers/connect');
const postContentType = require('../../../content-type-definitions/contentType4.json');
const tagContentType = require('../../../content-type-definitions/contentType2.json');
const categoryContentType = require('../../../content-type-definitions/contentType3.json');
const authorContentType = require('../../../content-type-definitions/contentType1.json');
const {flotiq} = require('../../../helpers/flotiq');

exports.importer = async (apiKey, wordpressUrl) => {
    console.log('Importing posts to Flotiq');
    let perPage = 25;
    let page = 1;
    let totalPages = 1;
    let totalCount = 1;
    let imported = 0;

    for(page; page <= totalPages; page++) {
        let wordpressResponse = await connect.wordpress(wordpressUrl, perPage, page, totalPages, 'posts');
        totalPages = wordpressResponse.totalPages;
        totalCount = wordpressResponse.totalCount;

        if (!totalCount) {
            return;
        }

        let posts = wordpressResponse.responseJson;
        let postsConverted = [];

        posts.map(async (post) => {
            postsConverted.push(convert(post));
        })

        await addAuthors(posts);

        let result = await flotiq(apiKey, postContentType.name, postsConverted);
        notify.resultNotify(result, 'Posts from page', page);
        result = await result.json()
        imported+=result.batch_success_count;
        console.log('Posts progress: ' + imported + '/' + totalCount);

    }

    async function addAuthors(posts) {
        let authors = [];
        posts.map(post => {
            authors.push(
                convertAuthors(post.author)
            )
        });

        let uniqueAuthors = authors.reduce((unique, o) => {
            if(!unique.some(obj => obj.id === o.id )) {
                unique.push(o);
            }
            return unique;
        },[]);

        await flotiq(apiKey, authorContentType.name, uniqueAuthors);
    }

    function convertAuthors(author) {
        return  {
            id: authorContentType.name + '_' + author.ID,
            slug: author.login,
            name: author.name,
            description: author.first_name + ' ' + author.last_name
        }
    }

    function convert(post) {
        let sourceTags = Object.values(post.tags);
        let tags = sourceTags.length ? sourceTags.map((tag) => {
            return {
                type: 'internal',
                dataUrl: '/api/v1/content/' + tagContentType.name + '/' + tagContentType.name + '_' + tag.ID
            };
        }) : [];

        let sourceCategories = Object.values(post.categories);
        let categories = sourceCategories.length ? sourceCategories.map((category) => {
            return {
                type: 'internal',
                dataUrl: '/api/v1/content/' + categoryContentType.name + '/' + categoryContentType.name + '_' + category.ID
            };
        }) : [];

        return {
            id: postContentType.name + '_' + post.ID,
            slug: post.slug,
            title: post.title,
            status: post.status,
            type: post.type,
            created: post.date,
            modified: post.modified,
            content: post.content,
            excerpt: post.excerpt,
            author: [{
                type: 'internal',
                dataUrl: '/api/v1/content/' + authorContentType.name + '/' + authorContentType.name + '_' + post.author.ID
            }],
            tags: tags,
            categories: categories
        }
    }
}
