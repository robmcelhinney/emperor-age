/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.org/docs/gatsby-config/
 */

module.exports = {
  /* Your site config here */
  siteMetadata: {
    title: `Robert McElhinney Portfolio`,
    siteUrl: `https://robmcelhinney.com`,
    description: `Robert McElhinney Portfolio`,
  },
  plugins: [`gatsby-plugin-react-helmet`, "gatsby-transformer-json"
  ]  
}
