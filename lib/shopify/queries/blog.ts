import seoFragment from '../fragments/seo';

const articleFragment = /* GraphQL */ `
  fragment article on Article {
    id
    title
    handle
    content
    contentHtml
    excerpt
    excerptHtml
    image {
      url
      altText
      width
      height
    }
    author: authorV2 {
      name
    }
    seo {
      ...seo
    }
    tags
    publishedAt
  }
  ${seoFragment}
`;

export const getArticleQuery = /* GraphQL */ `
  query getArticle($blogHandle: String!, $articleHandle: String!) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        ...article
      }
    }
  }
  ${articleFragment}
`;

export const getBlogArticlesQuery = /* GraphQL */ `
  query getBlogArticles($blogHandle: String!, $first: Int = 100) {
    blog(handle: $blogHandle) {
      articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
        edges {
          node {
            ...article
          }
        }
      }
    }
  }
  ${articleFragment}
`;

export const getAllBlogsQuery = /* GraphQL */ `
  query getAllBlogs($first: Int = 10) {
    blogs(first: $first) {
      edges {
        node {
          handle
          title
        }
      }
    }
  }
`;
