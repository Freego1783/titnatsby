const express = require('express');
const { parseMDX } = require('@tinacms/mdx');

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions;

  const result = await graphql(`
        {
          allFile(filter: { extension: { eq: "mdx" } }) {
            edges {
              node {
                id
                childMdx {
                  frontmatter {
                    slug
                  }
                  body
                }
              }
            }
          }
        }
      `);

  result.data.allFile.edges.forEach(({ node }) => {
    const { frontmatter, body } = node.childMdx;

    createPage({
      path: frontmatter.slug,
      component: require.resolve(`./src/templates/contentTemplate.js`),
      context: {
        parsedMdx: parseMDX(body, { field: { parser: { type: "markdown" } } }),
        variables: { relativePath: frontmatter.slug + ".mdx" },
        query: ` 
          query post($relativePath: String!) {
            post(relativePath: $relativePath) {
              ...PostParts
            }
          }

          fragment PostParts on Post {
            __typename
            title
            ... on Document {
              _sys {
                filename
                basename
                breadcrumbs
                path
                relativePath
                extension
              }
              id
            }
            body
          }`,
      },
      defer: true,
    });
  });
};

//Required as per https://tina.io/docs/frameworks/gatsby/#allowing-static-adminindexhtml-file-in-dev-mode
exports.onCreateDevServer = ({ app }) => {
  app.use('/admin', express.static('public/admin'));
};