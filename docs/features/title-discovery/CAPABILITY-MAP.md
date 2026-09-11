# Capability Map: title-discovery

| Module id | Responsibility | Depends on |
|---|---|---|
| people-company-search | Search titles by actor, director, production/distribution company or streaming platform | tmdb-catalog, web-experience |
| title-details-enrichment | Show credits, companies and provider context on complete title pages | tmdb-catalog, people-company-search |

Build order: people-company-search -> title-details-enrichment
