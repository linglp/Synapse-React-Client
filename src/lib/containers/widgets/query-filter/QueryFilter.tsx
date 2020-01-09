import './QueryFilter.scss'
import * as React from 'react'
import { QueryRange } from './QueryRange'
import { QueryEnum } from './QueryEnum'

import { unCamelCase } from '../../../utils/functions/unCamelCase'
import _ from 'lodash'

import {
  FacetColumnResultValues,
  FacetColumnResult,
  FacetColumnResultRange,
} from '../../../utils/synapseTypes/Table/FacetColumnResult'
import {
  FacetColumnValuesRequest,
  FacetColumnRangeRequest,
  FacetColumnRequest,
} from '../../../utils/synapseTypes/Table/FacetColumnRequest'
import { QueryBundleRequest, QueryResultBundle } from '../../../utils/synapseTypes'

export type QueryFilterProps = {
  applyChanges: Function
  isLoading?: boolean
  data: QueryResultBundle
  getLastQueryRequest?: Function
  token: string
}

const convertFacetToFacetColumnValuesRequest = (
  facet: FacetColumnResultValues,
): FacetColumnValuesRequest => ({
  concreteType: 'org.sagebionetworks.repo.model.table.FacetColumnValuesRequest',
  columnName: facet.columnName,
  facetValues: facet.facetValues
    .filter(facet => facet.isSelected === true)
    .map(facet => facet.value),
})

const convertFacetColumnRangeRequest = (
  facet: FacetColumnResultRange,
): FacetColumnRangeRequest => {
  let result = {
    concreteType:
      'org.sagebionetworks.repo.model.table.FacetColumnRangeRequest',
    columnName: facet.columnName, // The name of the faceted column
  }

  if (facet.columnMin) {
    result = { ...result, ...{ min: facet.columnMin, max: facet.columnMax } }
  }
  return result
}

const patchRequestFacets = (
  changedFacet: FacetColumnRequest,
  lastRequest?: QueryBundleRequest,
): FacetColumnRequest[] => {
  const selections = lastRequest ? lastRequest.query.selectedFacets || [] : []
  const changedFacetIndex = selections.findIndex(
    facet => facet.columnName === changedFacet.columnName,
  )

  const isEmptyValuesFacet = (changedFacet.concreteType === 'org.sagebionetworks.repo.model.table.FacetColumnValuesRequest' && (!changedFacet.facetValues || !changedFacet.facetValues.length))
  if (changedFacetIndex > -1) {
    if (isEmptyValuesFacet) {
      selections.splice(changedFacetIndex, 1)
    } else {
    selections[changedFacetIndex] = changedFacet
    }
  } else {
    selections.push(changedFacet)
  }
  return selections
}

const applyChangesToValuesColumn = (
  lastRequest: QueryBundleRequest | undefined,

  facet: FacetColumnResultValues,
  onChangeFn: Function,
  facetName?: string,
  checked: boolean = false,
) => {
  if (facetName) {
    facet.facetValues.forEach(facetValue => {
      if (facetValue.value === facetName) {
        facetValue.isSelected = checked
      }
    })
  } else {
    facet.facetValues.forEach(facet => {
      facet.isSelected = false
    })
  }

  const changedFacet = convertFacetToFacetColumnValuesRequest(facet)
  const result = patchRequestFacets(changedFacet, lastRequest)
  onChangeFn(result)
}

//rangeChanges
const applyChangesToRangeColumn = (
  lastRequest: QueryBundleRequest | undefined,
  facet: FacetColumnResultRange,
  onChangeFn: Function,
  values: string[],
) => {
  //console.log('TYPE' + typeof facet)
  facet.columnMin = values[0]
  facet.columnMax = values[1]

  const changedFacet = convertFacetColumnRangeRequest(facet)
  const result = patchRequestFacets(changedFacet, lastRequest)
  onChangeFn(result)
}

export const QueryFilter: React.FunctionComponent<QueryFilterProps> = 
(
  {data, isLoading = false, getLastQueryRequest, token, applyChanges} : QueryFilterProps,
): JSX.Element => {
  const columnModels = data.columnModels
  const facets = data.facets as FacetColumnResult[]
  const lastRequest = getLastQueryRequest
    ? getLastQueryRequest()
    : undefined

  //console.log(lastRequest && lastRequest.query.selectedFacets)

  return (
    <div className="queryFilter">
      {isLoading && <div>Loading...</div>}
      {!isLoading &&
        facets.map(facet => {
          const columnModel = columnModels!.find(
            model => model.name === facet.columnName,
          )

          return (
            <div className="queryFilter-facet" key={facet.columnName}>
              <label>{unCamelCase(facet.columnName)}</label>

              {facet.facetType === 'enumeration' && columnModel && (
                <QueryEnum
                  facetValues={(facet as FacetColumnResultValues).facetValues}
                  columnModel={columnModel!}
                  token={token}
                  onChange={
           
                      (facetName: string, checked: boolean) =>
                          applyChangesToValuesColumn(
                            lastRequest,
                            facet as FacetColumnResultValues,
                            applyChanges,
                            facetName,
                            checked,
                          )
                
                  }
                  onClear={
                    () =>
                          applyChangesToValuesColumn(
                            lastRequest,

                            facet as FacetColumnResultValues,
                            applyChanges,
                          )
             
                  }
                ></QueryEnum>
              )}
              {facet.facetType === 'range' && columnModel && (
                <QueryRange
                  facetResult={facet as FacetColumnResultRange}
                  columnModel={columnModel}
                  onChange={
                    (values: string[]) =>
                          applyChangesToRangeColumn(
                            lastRequest,
                            facet as FacetColumnResultRange,
                            applyChanges,
                            values,
                          )
                    
                  }
                ></QueryRange>
              )}
            </div>
          )
        })}
    </div>
  )
}
