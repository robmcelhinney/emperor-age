/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.org/docs/gatsby-config/
 */

module.exports = {
    /* Your site config here */
    siteMetadata: {
        title: `Robert McElhinney Portfolio`,
        siteUrl: `https://robmcelhinney.github.io/roman-emperors`,
        description: `Robert McElhinney Portfolio`,
    },
    pathPrefix: "/roman-emperors",
    plugins: [`gatsby-plugin-react-helmet`, "gatsby-transformer-json"],
}
