import { isEmpty } from 'lodash-es'
import React from 'react'
import { SynapseConstants } from '../utils'
import { PRODUCTION_ENDPOINT_CONFIG } from '../utils/functions/getEndpoint'
import {
  DOI_REGEX,
  SYNAPSE_ENTITY_ID_REGEX,
} from '../utils/functions/RegularExpressions'
import { unCamelCase } from '../utils/functions/unCamelCase'
import { SMALL_USER_CARD } from '../utils/SynapseConstants'
import { SynapseContext } from '../utils/SynapseContext'
import { ColumnModel, ColumnType, SelectColumn } from '../utils/synapseTypes'
import {
  CardLink,
  ColumnSpecifiedLink,
  CommonCardProps,
  DescriptionConfig,
  MarkdownLink,
} from './CardContainerLogic'
import HeaderCard from './HeaderCard'
import IconList from './IconList'
import MarkdownSynapse from './MarkdownSynapse'
import { CardFooter, Icon } from './row_renderers/utils'
import UserCard from './UserCard'
import { FileHandleLink } from './widgets/FileHandleLink'
import { ImageFileHandle } from './widgets/ImageFileHandle'

export type KeyToAlias = {
  key: string
  alias?: string
}

export type KeyToAliasMap = {
  [index: number]: KeyToAlias
  [index: string]: KeyToAlias
}

export type GenericCardSchema = {
  type: string
  title: string
  subTitle?: string
  description?: string
  icon?: string
  imageFileHandleColumnName?: string
  thumbnailRequiresPadding?: boolean
  secondaryLabels?: any[]
  link?: string
  dataTypeIconNames?: string
}

export type IconOptions = {
  [index: string]: string
}

export type GenericCardProps = {
  selectColumns?: SelectColumn[]
  columnModels?: ColumnModel[]
  facetAliases?: Record<string, string>
  iconOptions?: IconOptions
  isHeader?: boolean
  isAlignToLeftNav?: boolean
  // Maps columnName to index
  schema: Record<string, number>
  // Row values
  data: string[]
  tableEntityConcreteType: string | undefined
  tableId: string | undefined
  columnIconOptions?: {}
} & CommonCardProps

export type GenericCardState = {
  hasClickedShowMore: boolean
}

const CHAR_COUNT_CUTOFF = 400
export const CARD_SHORT_DESCRIPTION_CSS = 'SRC-short-description'
export const CARD_LONG_DESCRIPTION_CSS = 'SRC-long-description'

// This function isn't in the class only for ease of testing with renderShortDescription
export const getCutoff = (summary: string) => {
  let previewText = ''
  const summarySplit = summary.split(' ')
  // find num words to join such that its >= char_count_cutoff
  let i = 0
  while (previewText.length < CHAR_COUNT_CUTOFF && i < summarySplit.length) {
    previewText += `${summarySplit[i]} `
    i += 1
  }
  previewText = previewText.trim()
  return { previewText }
}

export const getValueOrMultiValue = ({
  columnName,
  value,
  selectColumns,
  columnModels,
}: {
  columnName?: string
  value?: string
  selectColumns?: SelectColumn[]
  columnModels?: ColumnModel[]
}): ValueOrMultiValue => {
  if (!value) {
    return {
      str: '',
      strList: undefined,
      columnModelType: undefined,
    }
  }
  const selectedColumnOrUndefined =
    selectColumns?.find(el => el.name === columnName) ||
    columnModels?.find(el => el.name === columnName)
  const isMultiValue = selectedColumnOrUndefined?.columnType.endsWith('_LIST')

  if (isMultiValue) {
    let val: any = value
    let strList: any
    try {
      strList = JSON.parse(val)
      val = (strList as string[]).join(', ')
      return {
        strList,
        str: val,
        columnModelType: selectedColumnOrUndefined?.columnType,
      }
    } catch (e) {
      console.error(
        'Could not parse multivalue string ',
        val,
        ' caught err ',
        e,
      )
    }
  }
  return { str: value, columnModelType: selectedColumnOrUndefined?.columnType }
}

type SynapseCardLabelProps = {
  value: string
  columnName: string
  labelLink: CardLink | MarkdownLink | ColumnSpecifiedLink | undefined
  selectColumns: SelectColumn[] | undefined
  columnModels: ColumnModel[] | undefined
  isHeader: boolean
  className?: string
  rowData: string[]
}

export const SynapseCardLabel: React.FC<SynapseCardLabelProps> = props => {
  const {
    value,
    columnName,
    labelLink,
    selectColumns,
    columnModels,
    isHeader,
    className,
    rowData,
  } = props
  if (!value) {
    return <>{value}</>
  }
  const { strList, str, columnModelType } = getValueOrMultiValue({
    columnName,
    value,
    selectColumns,
    columnModels,
  })

  if (!str) {
    // the array came back empty
    return <>{str}</>
  }

  let newClassName = className
  const style: React.CSSProperties = {}
  if (isHeader) {
    newClassName = className?.concat(' ', 'SRC-lightLink')
  }
  // PORTALS-1913: special rendering for user ID lists
  if (columnModelType === 'USERID_LIST' && strList) {
    return (
      <>
        {strList.map((val: string, index: number) => {
          return (
            <span key={val}>
              <UserCard
                ownerId={val}
                size={SMALL_USER_CARD}
                className={newClassName}
              />
              {/* \u00a0 is a nbsp; */}
              {index < strList.length - 1 && ',\u00a0\u00a0'}
            </span>
          )
        })}
      </>
    )
  }
  if (columnModelType === 'USERID' && str) {
    return (
      <UserCard ownerId={str} size={SMALL_USER_CARD} className={newClassName} />
    )
  }

  if (!labelLink) {
    // if this looks like a Synapse ID, then autolink.
    if (str.match(SYNAPSE_ENTITY_ID_REGEX)) {
      // its a synId
      return (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`${PRODUCTION_ENDPOINT_CONFIG.PORTAL}#!Synapse:${str}`}
          className={newClassName}
        >
          {str}
        </a>
      )
    } else {
      // they don't need a link
      return <>{str}</>
    }
  }

  if (labelLink.isMarkdown) {
    if (strList) {
      return (
        <>
          {strList.map((el, index) => {
            return (
              <span key={el}>
                <MarkdownSynapse key={el} renderInline={true} markdown={el} />
                {/* \u00a0 is a nbsp; */}
                {index < strList.length - 1 && ',\u00a0\u00a0'}
              </span>
            )
          })}
        </>
      )
    } else {
      return <MarkdownSynapse renderInline={true} markdown={value} />
    }
  }
  const split = strList ? strList : str.split(',')
  if ('linkColumnName' in labelLink) {
    const linkIndex =
      selectColumns?.findIndex(el => el.name === labelLink.linkColumnName) ||
      columnModels?.findIndex(el => el.name === labelLink.linkColumnName)
    if (linkIndex == null) {
      console.warn(
        `Could not determine column index of ${labelLink.linkColumnName}`,
      )
      return <>{value}</>
    } else {
      const href = rowData[linkIndex]

      if (isEmpty(href)) {
        return <>{value}</>
      }

      return (
        <>
          {split.map((el, index) => {
            return (
              <React.Fragment key={el}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={el}
                  className={newClassName}
                  style={style}
                >
                  {el}
                </a>
                {index < split.length - 1 && (
                  <span style={{ marginRight: 4 }}>, </span>
                )}
              </React.Fragment>
            )
          })}
        </>
      )
    }
  } else {
    return (
      <>
        {split.map((el, index) => {
          const { baseURL, URLColumnName, wrapValueWithParens } = labelLink
          const value = wrapValueWithParens ? `(${el})` : el
          const href = `/${baseURL}?${URLColumnName}=${value}`

          return (
            <React.Fragment key={el}>
              <a href={href} key={el} className={newClassName} style={style}>
                {el}
              </a>
              {index < split.length - 1 && (
                <span style={{ marginRight: 4 }}>, </span>
              )}
            </React.Fragment>
          )
        })}
      </>
    )
  }
}

type ValueOrMultiValue = {
  str: string
  strList?: string[]
  columnModelType?: ColumnType
}

export default class GenericCard extends React.Component<
  GenericCardProps,
  GenericCardState
> {
  static contextType = SynapseContext

  constructor(props: GenericCardProps) {
    super(props)
    this.state = {
      hasClickedShowMore: false,
    }
    this.getLinkParams = this.getLinkParams.bind(this)
    this.getCardLinkHref = this.getCardLinkHref.bind(this)
    this.renderLongDescription = this.renderLongDescription.bind(this)
    this.renderShortDescription = this.renderShortDescription.bind(this)
  }

  public getLinkParams(
    link: string,
    cardLinkConfig: CardLink | undefined,
    data: string[] | undefined,
    schema: any | undefined,
  ): {
    href: string
    target: string
  } {
    link = link.trim()
    let href = link
    let target = '_self'
    if (link.match(SYNAPSE_ENTITY_ID_REGEX)) {
      // its a synId
      href = `${PRODUCTION_ENDPOINT_CONFIG.PORTAL}#!Synapse:${link}`
    } else if (link.match(DOI_REGEX)) {
      target = '_blank'
      href = `https://dx.doi.org/${link}`
    } else if (!cardLinkConfig) {
      target = '_blank'
    } else if (cardLinkConfig) {
      href = this.getCardLinkHref(cardLinkConfig, data, schema) ?? ''
    }
    return { href, target }
  }

  public getCardLinkHref(
    cardLink: CardLink | undefined,
    data: string[] | undefined,
    schema: Record<string, number> | undefined,
  ): string | undefined {
    if (cardLink) {
      if (!data || !schema) {
        throw Error('Must specify CardLink and data for linking to work')
      }
      const { matchColumnName, URLColumnName, overrideLinkURLColumnName } = cardLink

      // PORTALS-2088:  Return the link, unless...
      // an overrideLinkURLColumnName has been set and it's value is defined.
      // In this case, just use the overrideLinkURLColumnName value
      if (overrideLinkURLColumnName && schema[overrideLinkURLColumnName]) {
        const indexOfOverrideLinkURLColumnName = schema[overrideLinkURLColumnName]
        const overrideLinkValue = data[indexOfOverrideLinkURLColumnName]
        if (overrideLinkValue) {
          return overrideLinkValue
        }
      }

      const indexInData = schema[matchColumnName]
      if (indexInData === undefined) {
        console.error(
          `Could not find match for data: ${data} with columnName ${matchColumnName}`,
        )
      } else {
        const value = data[indexInData]
        if (value) {
          // value is defined!
          return `/${cardLink.baseURL}?${URLColumnName}=${value}`
        }
      }
    }
    return undefined
  }

  getCutoff = (summary: string) => {
    let previewText = ''
    const summarySplit = summary!.split(' ')
    // find num words to join such that its >= char_count_cutoff
    let i = 0
    while (previewText.length < CHAR_COUNT_CUTOFF && i < summarySplit.length) {
      previewText += `${summarySplit[i]} `
      i += 1
    }
    previewText = previewText.trim()
    return { previewText }
  }

  toggleShowMore = () => {
    this.setState({
      hasClickedShowMore: true,
    })
  }

  renderTitle = ({
    href,
    target,
    titleSearchHandle,
    title,
  }: {
    target: string
    titleSearchHandle: string | undefined
    title: string
    href: string
  }) => {
    if (href) {
      return (
        <a
          data-search-handle={titleSearchHandle}
          target={target}
          href={href}
          className="highlight-link"
        >
          {title}
        </a>
      )
    } else {
      return <span data-search-handle={titleSearchHandle}> {title} </span>
    }
  }

  render() {
    const {
      schema,
      data,
      genericCardSchema,
      secondaryLabelLimit,
      selectColumns,
      columnModels,
      iconOptions,
      isHeader = false,
      titleLinkConfig,
      ctaLinkConfig,
      labelLinkConfig,
      facetAliases = {},
      descriptionConfig,
      rgbIndex,
      tableId,
      tableEntityConcreteType,
      columnIconOptions,
    } = this.props

    // GenericCard inherits properties from CommonCardProps so that the properties have the same name
    // and type, but theres one nuance which is that we can't override if one specific property will be
    // defined, so we assert genericCardSchema is not null and assign to genericCardSchemaDefined
    const genericCardSchemaDefined = genericCardSchema!
    const { hasClickedShowMore } = this.state
    const { link = '', type } = genericCardSchemaDefined
    const title = data[schema[genericCardSchemaDefined.title]]
    let subTitle =
      genericCardSchemaDefined.subTitle &&
      data[schema[genericCardSchemaDefined.subTitle]]
    subTitle =
      genericCardSchemaDefined?.subTitle &&
      getValueOrMultiValue({
        value: subTitle,
        columnName: genericCardSchemaDefined?.subTitle,
        selectColumns,
        columnModels,
      }).str
    const description = data[schema[genericCardSchemaDefined.description || '']]
    const iconValue = data[schema[genericCardSchemaDefined.icon || '']]
    const dataTypeIconNames =
      data[schema[genericCardSchemaDefined.dataTypeIconNames || '']]
    const imageFileHandleIdValue =
      data[schema[genericCardSchemaDefined.imageFileHandleColumnName || '']]

    const titleColumnModel = columnModels?.find(
      el => genericCardSchemaDefined.link === el.name,
    )
    const titleColumnType = titleColumnModel?.columnType
    // wrap link in parens because undefined would throw an error
    const linkValue: string = data[schema[link]] || ''
    const { href, target } = this.getLinkParams(
      linkValue,
      titleLinkConfig,
      data,
      schema,
    )
    const values: string[][] = []
    const { secondaryLabels = [] } = genericCardSchemaDefined
    for (let i = 0; i < secondaryLabels.length; i += 1) {
      const columnName = secondaryLabels[i]
      let value: any = data[schema[columnName]]
      if (value) {
        const labelLink = labelLinkConfig?.find(
          el => el.matchColumnName === columnName,
        )
        value = SynapseCardLabel({
          value,
          columnName,
          labelLink,
          isHeader,
          selectColumns,
          columnModels,
          rowData: data,
        })
        const columnDisplayName = unCamelCase(columnName, facetAliases)
        const keyValue = [columnDisplayName, value, columnName]
        values.push(keyValue)
      }
    }

    const showFooter = values.length > 0

    const style: React.CSSProperties = {
      // undefined, take default value from class
      marginTop: isHeader ? '0px' : undefined,
      marginBottom: isHeader ? '0px' : undefined,
      paddingBottom: showFooter || imageFileHandleIdValue ? undefined : '15px',
    }
    const icon: JSX.Element = (
      <>
        {imageFileHandleIdValue && (
          <div
            className="SRC-imageThumbnail"
            style={{
              padding: genericCardSchemaDefined.thumbnailRequiresPadding
                ? '21px'
                : undefined,
            }}
          >
            <ImageFileHandle
              fileHandleId={imageFileHandleIdValue}
              tableEntityConcreteType={tableEntityConcreteType}
              rowId={data[schema.id]}
              tableId={tableId}
            />
          </div>
        )}
        {!imageFileHandleIdValue && (
          <div className="SRC-cardThumbnail">
            <Icon iconOptions={iconOptions} value={iconValue} type={type} />
          </div>
        )}
      </>
    )

    if (isHeader) {
      return (
        <HeaderCard
          descriptionConfig={descriptionConfig}
          title={title}
          subTitle={subTitle}
          description={description}
          type={type}
          icon={icon}
          values={values}
          href={href}
          target={target}
          isAlignToLeftNav={true}
          secondaryLabelLimit={secondaryLabelLimit}
          rgbIndex={rgbIndex}
        />
      )
    }

    const titleSearchHandle = unCamelCase(
      genericCardSchemaDefined.title,
      facetAliases,
    )
    const stubTitleSearchHandle = unCamelCase(
      genericCardSchemaDefined.subTitle,
      facetAliases,
    )
    const descriptionSubTitle = unCamelCase(
      genericCardSchemaDefined.description,
      facetAliases,
    )

    let ctaHref: string | undefined = undefined,
      ctaTarget: string | undefined = undefined
    if (ctaLinkConfig) {
      const ctaLinkValue: string = data[schema[ctaLinkConfig.link]] || ''
      const { href: newCtaHref, target: newCtaTarget } = this.getLinkParams(
        ctaLinkValue,
        undefined, //card link config
        data,
        schema,
      )
      ctaHref = newCtaHref
      ctaTarget = newCtaTarget
    }
    return (
      <div style={style} className={'SRC-portalCard'}>
        <div className={'SRC-portalCardMain'}>
          {icon}
          <div className="SRC-cardContent">
            <div className="SRC-type">{type}</div>
            {
              // If the portal configs has columnIconOptions.columns.dataType option
              // and the column value is not null, display the card data type icons
              columnIconOptions?.columns?.dataType && dataTypeIconNames?.length && (
                <div style={{ marginTop: '20px' }}>
                  <IconList
                    iconConfigs={columnIconOptions.columns.dataType}
                    iconNames={JSON.parse(dataTypeIconNames)}
                    useBackground={true}
                    useTheme={true}
                  />
                </div>
              )
            }
            <div>
              <h3
                className="SRC-boldText SRC-blackText"
                style={{ margin: 'none' }}
              >
                {!titleLinkConfig &&
                titleColumnType === ColumnType.FILEHANDLEID ? (
                  <FileHandleLink
                    fileHandleId={linkValue}
                    tableEntityConcreteType={tableEntityConcreteType}
                    showDownloadIcon={type !== SynapseConstants.EXPERIMENTAL}
                    rowId={data![schema.id]}
                    tableId={tableId}
                    displayValue={title}
                  />
                ) : (
                  this.renderTitle({
                    href,
                    target,
                    titleSearchHandle,
                    title,
                  })
                )}
              </h3>
            </div>
            {subTitle && (
              <div
                data-search-handle={stubTitleSearchHandle}
                className="SRC-author"
              >
                {subTitle}
              </div>
            )}
            {/* 
              Below is a hack that allows word highlighting to work, the Search component insert's
              html elements outside of the React DOM which if detected would break the app,
              but as written below this avoids that reconcilliation process.
            */}
            {description &&
              this.renderShortDescription(
                description,
                hasClickedShowMore,
                descriptionSubTitle,
                descriptionConfig,
              )}
            {description &&
              this.renderLongDescription(
                description,
                hasClickedShowMore,
                descriptionSubTitle,
                descriptionConfig,
              )}
            {ctaLinkConfig && ctaHref && ctaTarget && (
              <div className="SRC-portalCardCTALink bootstrap-4-backport">
                <a target={ctaTarget} rel="noopener noreferrer" href={ctaHref}>
                  {ctaLinkConfig.text}
                </a>
              </div>
            )}
          </div>
        </div>
        {showFooter && (
          <CardFooter
            isHeader={false}
            secondaryLabelLimit={secondaryLabelLimit}
            values={values}
            columnIconOptions={columnIconOptions}
            className={`${imageFileHandleIdValue ? 'hasImage' : 'hasIcon'}`}
          />
        )}
      </div>
    )
  }

  public renderLongDescription(
    description: string,
    hasClickedShowMore: boolean,
    descriptionSubTitle: any,
    descriptionConfig?: DescriptionConfig,
  ): React.ReactNode {
    let content: JSX.Element | string = description
    if (descriptionConfig?.isMarkdown) {
      content = <MarkdownSynapse markdown={content} />
    }
    const show =
      hasClickedShowMore || descriptionConfig?.showFullDescriptionByDefault
    return (
      <div className={show ? '' : 'SRC-hidden'}>
        <span
          data-search-handle={descriptionSubTitle}
          className={`SRC-font-size-base ${CARD_LONG_DESCRIPTION_CSS}`}
        >
          {content}
        </span>
      </div>
    )
  }

  public renderShortDescription(
    description: string,
    hasClickedShowMore: boolean,
    descriptionSubTitle: any,
    descriptionConfig?: DescriptionConfig,
  ): React.ReactNode {
    if (descriptionConfig?.showFullDescriptionByDefault) {
      return <></>
    }
    return (
      <div className={hasClickedShowMore ? 'SRC-hidden' : ''}>
        <span
          data-search-handle={descriptionSubTitle}
          className={`SRC-font-size-base ${CARD_SHORT_DESCRIPTION_CSS} SRC-short-description`}
        >
          {getCutoff(description).previewText}
        </span>
        {description.length >= CHAR_COUNT_CUTOFF && (
          <a
            style={{
              fontSize: '16px',
              cursor: 'pointer',
              marginLeft: '5px',
            }}
            className="highlight-link"
            onClick={this.toggleShowMore}
          >
            ...Show More
          </a>
        )}
      </div>
    )
  }
}
