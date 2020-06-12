/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.org/docs/gatsby-config/
 */

module.exports = {
  /* Your site config here */
  siteMetadata: {
    title: `Robert McElhinney Portfolio`,
    siteUrl: `https://robmcelhinney.github.com/emperor-age`,
    description: `Robert McElhinney Portfolio`,
  },
  pathPrefix: "/emperor-age",
  plugins: [`gatsby-plugin-react-helmet`, "gatsby-transformer-json"
  ]  
}
