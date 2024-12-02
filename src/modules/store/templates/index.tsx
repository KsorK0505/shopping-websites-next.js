import { Suspense, useState, useEffect } from 'react'
import { notFound } from 'next/navigation'

import { storeSortOptions } from '@lib/constants'
import { getProductsList, getStoreFilters } from '@lib/data/products'
import { getRegion } from '@lib/data/regions'
import { Box } from '@modules/common/components/box'
import { Container } from '@modules/common/components/container'
import RefinementList from '@modules/common/components/sort'
import { Text } from '@modules/common/components/text'
import { ProductCarousel } from '@modules/products/components/product-carousel'
import { search } from '@modules/search/actions'
import SkeletonProductGrid from '@modules/skeletons/templates/skeleton-product-grid'
import SkeletonProductsCarousel from '@modules/skeletons/templates/skeleton-products-carousel'

import ProductFilters from '../components/filters'
import ActiveProductFilters from '../components/filters/active-filters'
import ProductFiltersDrawer from '../components/filters/filters-drawer'
import PaginatedProducts from './paginated-products'

export const runtime = 'edge'

export default function StoreTemplate({
  searchParams,
  params,
}: {
  searchParams: Record<string, string>
  params?: { countryCode?: string }
}) {
  const { sortBy, page, collection, type, material, price } = searchParams;
  const [region, setRegion] = useState({});

  const pageNumber = page ? parseInt(page) : 1;
  const [filters, setFilters] = useState({collection: [], material: [], type: []});
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);

  // TODO: Add logic in future
  const [recommendedProducts, setRecommendProducts] = useState([]);

  useEffect(() => {
    const fetchSearch = async () => {
      const response = await search({
        currency_code: region.currency_code,
        order: sortBy,
        page: pageNumber,
        collection: collection?.split(','),
        type: type?.split(','),
        material: material?.split(','),
        price: price?.split(','),
      });
      setResults(response.results);
      setCount(response.count);
    
    };

    const fetchProducts = async () => {
      const response = await getProductsList({
        pageParam: 0,
        queryParams: { limit: 9 },
        countryCode: params.countryCode,
      });

      setRecommendProducts(response.response.products);
    }
    getRegion(params.countryCode).then(response => setRegion(response))
    
    getStoreFilters().then(response => setFilters(response || []));

    fetchSearch();
    fetchProducts();
  }, []);

  return (
    <>
      <Container className="flex flex-col gap-8 !pb-8 !pt-4">
        <Box className="flex flex-col gap-4">
          <Text className="text-md text-secondary">
            {count === 1 ? `${count} product` : `${count} products`}
          </Text>
          <Box className="grid w-full grid-cols-2 items-center justify-between gap-2 small:flex small:flex-wrap">
            <Box className="hidden small:flex">
              <ProductFilters filters={filters} />
            </Box>
            <ProductFiltersDrawer>
              <ProductFilters filters={filters} />
            </ProductFiltersDrawer>
            <RefinementList
              options={storeSortOptions}
              sortBy={sortBy || 'relevance'}
            />
          </Box>
        </Box>
        <ActiveProductFilters
          countryCode={params.countryCode}
          filters={filters}
        />
        <Suspense fallback={<SkeletonProductGrid />}>
          {results && results.length > 0 ? (
            <PaginatedProducts
              products={results}
              page={pageNumber}
              total={count}
              countryCode={params.countryCode}
            />
          ) : (
            <p className="py-10 text-center text-lg text-secondary">
              No products.
            </p>
          )}
        </Suspense>
      </Container>
      {recommendedProducts && (
        <Suspense fallback={<SkeletonProductsCarousel />}>
          <ProductCarousel
            products={recommendedProducts}
            regionId={region.id}
            title="Recommended products"
          />
        </Suspense>
      )}
    </>
  )
}
