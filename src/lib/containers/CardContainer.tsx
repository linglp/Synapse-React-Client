import React from 'react'
import { Button } from 'react-bootstrap'
import useGetInfoFromIds from '../utils/hooks/useGetInfoFromIds'
import {
  OBSERVATION_CARD,
  DATASET,
  DEFAULT_PAGE_SIZE,
  FUNDER,
  GENERIC_CARD,
  MEDIUM_USER_CARD,
} from '../utils/SynapseConstants'
import {
  EntityHeader,
  QueryBundleRequest,
  QueryResultBundle,
  Row,
} from '../utils/synapseTypes/'
import { CardConfiguration } from './CardContainerLogic'
import GenericCard from './GenericCard'
import loadingScreen from './LoadingScreen'
import { Dataset, Funder } from './row_renderers'
import { LoadingObservationCard, ObservationCard } from './row_renderers/ObservationCard'
import NoContentAvailable from './table/NoContentAvailable'
import SearchResultsNotFound from './table/SearchResultsNotFound'
import TotalQueryResults from './TotalQueryResults'
import UserCardList from './UserCardList'

export type CardContainerProps = {
  data?: QueryResultBundle
  isHeader?: boolean
  isAlignToLeftNav?: boolean
  title?: string
  executeQueryRequest?: (param: QueryBundleRequest) => void
  facetAliases?: Record<string, string>
  getLastQueryRequest?: () => QueryBundleRequest
  getNextPageOfData?: (queryRequest: QueryBundleRequest) => void
  isLoading?: boolean
  facet?: string
  unitDescription?: string
  hasMoreData?: boolean
  showBarChart?: boolean
} & CardConfiguration

export const CardContainer = (props: CardContainerProps) => {
  const {
    data,
    isHeader = false,
    facet,
    unitDescription,
    type,
    isLoading,
    secondaryLabelLimit = 3,
    showBarChart = true,
    title,
    getLastQueryRequest,
    executeQueryRequest,
    hasMoreData,
    ...rest
  } = props
  const queryRequest = props.getLastQueryRequest!()
  /**
   * Handle a click on next or previous
   *
   * @memberof SynapseTable
   */
  const handleViewMore = () => {
    let offset = queryRequest.query.offset!
    // paginate forward
    offset += queryRequest.query.limit ?? DEFAULT_PAGE_SIZE
    queryRequest.query.offset = offset
    props.getNextPageOfData!(queryRequest)
  }

  const renderCard = (props: any, type: string) => {
    switch (type) {
      case DATASET:
        return <Dataset {...props} />
      case FUNDER:
        return <Funder {...props} />
      case GENERIC_CARD:
        return <GenericCard {...props} />
      case OBSERVATION_CARD:
        return <ObservationCard {...props} />
      default:
        return <div /> // this should never happen
    }
  }

  const ids = data?.queryResult.queryResults.tableId
    ? [data?.queryResult.queryResults.tableId]
    : []
  const tableEntityConcreteType = useGetInfoFromIds<EntityHeader>({
    ids,
    type: 'ENTITY_HEADER',
  })
  // the cards only show the loading screen on initial load, this occurs when data is undefined
  if (!data) {
    return <div>
      {isLoading && type === OBSERVATION_CARD && <LoadingObservationCard />}
      {isLoading && type !== OBSERVATION_CARD && loadingScreen}
    </div>
  } else if (data && data.queryResult.queryResults.rows.length === 0) {
    // data was retrieved from the backend but there is none to show.
    if (queryRequest.query.additionalFilters) {
      return <SearchResultsNotFound />
    }
    // else show "no results" UI (see PORTALS-1497)
    return (
      <NoContentAvailable />
    )
  }
  const schema = {}
  data.queryResult.queryResults.headers.forEach((element, index) => {
    schema[element.name] = index
  })
  const showViewMoreButton = hasMoreData && (
    <div className="SRC-viewMore bootstrap-4-backport">
      <Button variant="secondary" className="pill-xl" onClick={handleViewMore}>
        View More
      </Button>
    </div>
  )
  let cards
  if (type === MEDIUM_USER_CARD) {
    // Hard coding ownerId as a column name containing the user profile ownerId
    // for each row, grab the column with the ownerId
    const userIdColumnIndex = data.queryResult.queryResults.headers.findIndex(
      el => el.columnType === 'USERID',
    )
    if (userIdColumnIndex === -1) {
      throw Error(
        'Type MEDIUM_USER_CARD specified but no columnType USERID found',
      )
    }
    const listIds = data.queryResult.queryResults.rows.map(
      el => el.values[userIdColumnIndex],
    )
    cards = <UserCardList data={data} list={listIds} size={MEDIUM_USER_CARD} />
  } else {
    // render the cards
    const cardsData = data.queryResult.queryResults.rows
    cards = cardsData.length ? (
      cardsData.map((rowData: Row) => {
        const key = JSON.stringify(rowData.values)
        const propsForCard = {
          key,
          type,
          schema,
          isHeader,
          secondaryLabelLimit,
          data: rowData.values,
          selectColumns: data.selectColumns,
          columnModels: data.columnModels,
          tableEntityConcreteType:
            tableEntityConcreteType[0] && tableEntityConcreteType[0].type,
          tableId: props.data?.queryResult.queryResults.tableId,
          ...rest,
        }
        return renderCard(propsForCard, type)
      })
    ) : (
      <></>
    )
  }

  return (
    <div role="list">
      {title && <h2 className="SRC-card-overview-title">{title}</h2>}
      {!title && unitDescription && showBarChart && (
        <TotalQueryResults
          isLoading={isLoading!}
          unitDescription={unitDescription}
          executeQueryRequest={executeQueryRequest}
          lastQueryRequest={getLastQueryRequest!()}
          frontText={'Displaying'}
        />
      )}
      {/* ReactCSSTransitionGroup adds css fade in property for cards that come into view */}
      {cards}
      {showViewMoreButton}
    </div>
  )
}

export default CardContainer
