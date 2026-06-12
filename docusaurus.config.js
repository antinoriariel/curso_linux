// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Curso de Linux',
  tagline: 'De cero a conceptos avanzados',
  favicon: 'img/favicon.svg',

  // URL de producción del sitio. Ajustar al hacer el deploy real.
  url: 'https://tu-usuario.github.io',
  // Pathname bajo el que se sirve el sitio. Para GitHub Pages de proyecto
  // suele ser '/<nombre-del-repo>/'.
  baseUrl: '/',

  // Configuración para deploy en GitHub Pages. Ajustar a los valores reales.
  organizationName: 'tu-usuario',
  projectName: 'curso-linux',

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // Modo "solo docs": el curso es la raíz del sitio.
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          showLastUpdateTime: false,
          // Enlace "Editar esta página". Ajustar al repositorio real.
          // editUrl: 'https://github.com/tu-usuario/curso-linux/tree/master/',
        },
        blog: false,
        pages: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/logo.svg',
      colorMode: {
        defaultMode: 'dark',
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Curso de Linux',
        logo: {
          alt: 'Logo del Curso de Linux',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'cursoSidebar',
            position: 'left',
            label: 'Curso',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Curso',
            items: [
              {
                label: 'Índice de contenidos',
                to: '/',
              },
            ],
          },
          {
            title: 'Recursos',
            items: [
              {
                label: 'Documentación de Arch Wiki',
                href: 'https://wiki.archlinux.org/',
              },
              {
                label: 'The Linux Documentation Project',
                href: 'https://tldp.org/',
              },
              {
                label: 'man7.org',
                href: 'https://man7.org/',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Curso de Linux. Construido con Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'diff', 'ini', 'systemd', 'docker', 'yaml', 'awk', 'makefile', 'nginx'],
      },
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
      },
    }),
};

export default config;
