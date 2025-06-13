import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head, Search } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: {
    default: 'Maraikka Documentation',
    template: '%s | Maraikka'
  },
  description: 'Complete documentation for Maraikka - Secure File Encryption Application',
  openGraph: {
    title: 'Maraikka Documentation',
    description: 'Complete documentation for Maraikka - Secure File Encryption Application',
    type: 'website',
  },
}

const banner = (
  <Banner storageKey="maraikka-docs">
    🔒 Maraikka Documentation - Your guide to secure file encryption
  </Banner>
)

const navbar = (
  <Navbar 
    logo={<span style={{ fontWeight: 'bold', color: '#8b5cf6' }}>🔒 Maraikka</span>}
    projectLink="https://github.com/maraikka-labs/maraikka-app"
  />
)

const footer = (
  <Footer className="flex-col items-center md:items-start">
    MIT {new Date().getFullYear()} © Maraikka Labs.
  </Footer>
)

export default async function RootLayout({ children }) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
    >
      <Head
        backgroundColor={{
          dark: 'rgb(15, 23, 42)',
          light: 'rgb(254, 252, 232)'
        }}
        color={{
          hue: { dark: 270, light: 270 },
          saturation: { dark: 100, light: 100 }
        }}
      />
      <body>
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/maraikka-labs/maraikka-app/tree/main/documentation"
          editLink="Edit this page on GitHub"
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          footer={footer}
          search={
            <Search
              placeholder="Search documentation..."
              emptyResult="No results found."
              errorText="Failed to load search index."
              loading="Loading..."
            />
          }
          themeSwitch={{
            dark: 'Dark',
            light: 'Light',
            system: 'System'
          }}
          toc={{
            backToTop: 'Back to top',
            title: 'On this page'
          }}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
} 