import Form, { AjvError } from '@sage-bionetworks/rjsf-core'
import { JSONSchema7 } from 'json-schema'
import isEmpty from 'lodash-es/isEmpty'
import React, { useEffect, useRef } from 'react'
import { Alert, Button, Modal } from 'react-bootstrap'
import { useErrorHandler } from 'react-error-boundary'
import ReactTooltip from 'react-tooltip'
import AddToList from '../../../assets/icons/AddToList'
import {
  BackendDestinationEnum,
  getEndpoint,
} from '../../../utils/functions/getEndpoint'
import {
  useGetJson,
  useUpdateViaJson,
} from '../../../utils/hooks/SynapseAPI/useEntity'
import {
  useGetSchema,
  useGetSchemaBinding,
} from '../../../utils/hooks/SynapseAPI/useSchema'
import { SynapseClientError } from '../../../utils/SynapseClient'
import { EntityJson, entityJsonKeys } from '../../../utils/synapseTypes'
import { SynapseSpinner } from '../../LoadingScreen'
import { AdditionalPropertiesSchemaField } from './AdditionalPropertiesSchemaField'
import {
  dropNullishArrayValues,
  getFriendlyPropertyName,
  transformErrors,
} from './AnnotationEditorUtils'
import { CustomAdditionalPropertiesFieldTemplate } from './CustomAdditionalPropertiesFieldTemplate'
import { CustomArrayFieldTemplate } from './CustomArrayFieldTemplate'
import { CustomBooleanWidget } from './CustomBooleanWidget'
import { CustomDateTimeWidget } from './CustomDateTimeWidget'
import { CustomDefaultTemplate } from './CustomDefaultTemplate'
import { CustomObjectFieldTemplate } from './CustomObjectFieldTemplate'
import { CustomSelectWidget } from './CustomSelectWidget'
import CustomTextWidget from './CustomTextWidget'

export type SchemaDrivenAnnotationEditorProps = {
  /** The entity whose annotations should be edited with the form */
  entityId?: string
  /** If no entity ID is supplied, the schema to use for the form */
  schemaId?: string
  liveValidate?: boolean
  onSuccess?: () => void
  /** If defined, shows a 'Cancel' button and runs this effect on click */
  onCancel?: () => void
}

export type SchemaDrivenAnnotationEditorModalProps = {
  entityId: string
  show: boolean
  onHide: () => void
}

// patternProperties lets us define how to treat additionalProperties in a JSON schema by property name
// here we can ban properties that collide with entity properties by making their schema "not: {}"
const patternPropertiesBannedKeys = entityJsonKeys.reduce((current, item) => {
  current[`^${item}$`] = { not: {} }
  return current
}, {})

/**
 * Renders a form for editing an entity's annotations. The component also supports supplying just a schema ID,
 * but work to support annotation flows without an entity (i.e. before creating entities) is not yet complete.
 */
export const SchemaDrivenAnnotationEditor = (
  props: SchemaDrivenAnnotationEditorProps,
) => {
  const {
    entityId,
    schemaId,
    liveValidate = false,
    onSuccess = () => {
      /* no-op */
    },
    onCancel,
  } = props
  const handleError = useErrorHandler()
  const formRef = useRef<Form<Record<string, unknown>>>(null)

  // Annotation fields fetched and modified via the form
  const [formData, setFormData] = React.useState<
    Record<string, unknown> | undefined
  >(undefined)

  // Client-side validation errors
  const [validationError, setValidationError] = React.useState<
    AjvError[] | undefined
  >(undefined)

  // Errors from the backend response
  const [submissionError, setSubmissionError] = React.useState<
    SynapseClientError | undefined
  >(undefined)
  const [showSubmissionError, setShowSubmissionError] = React.useState(false)

  const [showConfirmation, setShowConfirmation] = React.useState(false)

  const ANNOTATION_EDITOR_TOOLTIP_ID = 'AnnotationEditorTooltip'

  const { entityMetadata: entityJson, annotations } = useGetJson(entityId!, {
    enabled: !entityId || !formData, // once we have data, don't refetch. it would overwrite the user's entries
    onError: e => {
      if (e.status !== 404) {
        handleError(e)
      }
    },
  })

  useEffect(() => {
    if (annotations) {
      // Put the annotations into a state variable so it can be modified by the form.
      setFormData(annotations)
    }
  }, [annotations])

  const { data: schema, isLoading: isLoadingBinding } = useGetSchemaBinding(
    entityId!,
    {
      enabled: !!entityId,
      retry: false,
      refetchOnWindowFocus: false,
      onError: e => {
        if (e.status !== 404) {
          handleError(e)
        }
      },
    },
  )

  const { data: validationSchema, isLoading: isLoadingSchema } = useGetSchema(
    schemaId ?? schema?.jsonSchemaVersionInfo.$id ?? '',
    {
      enabled: !!schemaId || !!schema,
      select: schema => {
        // Have to remove the ID because of a bug in RJSF
        // https://github.com/rjsf-team/react-jsonschema-form/issues/2471
        delete schema.$id
        return schema
      },
      onError: e => {
        if (e.status !== 404) {
          handleError(e)
        }
      },
    },
  )

  const isLoading = isLoadingBinding || isLoadingSchema

  const mutation = useUpdateViaJson({
    onSuccess: () => {
      onSuccess()
    },
    onError: error => {
      setSubmissionError(error)
      setShowSubmissionError(true)
    },
  })

  function submitChangedEntity() {
    mutation.mutate({
      ...dropNullishArrayValues(formData ?? {}),
      ...entityJson,
    } as EntityJson)
  }

  return (
    <div className="bootstrap-4-backport AnnotationEditor">
      {isLoading ? (
        <div className="LoadingPlaceholder">
          <SynapseSpinner size={30} />
        </div>
      ) : (
        <>
          <ReactTooltip id={ANNOTATION_EDITOR_TOOLTIP_ID} />
          {entityJson && schema && (
            <Alert
              dismissible={false}
              show={true}
              variant="info"
              transition={false}
            >
              <b>{entityJson.name}</b> requires scientific annotations specified
              by <b>{schema.jsonSchemaVersionInfo.$id}</b>
              {'. '}
              <b>
                <a
                  href={`${getEndpoint(
                    BackendDestinationEnum.REPO_ENDPOINT,
                  )}/repo/v1/schema/type/registered/${
                    schema.jsonSchemaVersionInfo.$id
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View required schema
                </a>
              </b>
            </Alert>
          )}
          {entityJson && (!formData || isEmpty(formData)) && !schema && (
            <Alert
              dismissible={false}
              show={true}
              variant="info"
              transition={false}
            >
              <b>{entityJson.name}</b> has no annotations. Click the{' '}
              <AddToList /> button to annotate.
            </Alert>
          )}
          <Form
            className="AnnotationEditorForm"
            liveValidate={liveValidate}
            noHtml5Validate={true}
            ArrayFieldTemplate={CustomArrayFieldTemplate}
            ObjectFieldTemplate={CustomObjectFieldTemplate}
            FieldTemplate={CustomDefaultTemplate}
            ref={formRef}
            disabled={mutation.isLoading}
            /* Errors are displayed by an Alert component below, so we don't show the builtin ErrorList */
            ErrorList={() => null}
            schema={
              {
                ...(validationSchema ?? {}),
                patternProperties: {
                  ...(validationSchema?.patternProperties ?? {}),
                  ...patternPropertiesBannedKeys,
                },
                additionalProperties:
                  validationSchema?.additionalProperties ?? true,
              } as JSONSchema7
            }
            uiSchema={{
              'ui:DuplicateKeySuffixSeparator': '_',
              additionalProperties: {
                'ui:field': AdditionalPropertiesSchemaField,
                'ui:FieldTemplate': CustomAdditionalPropertiesFieldTemplate,
              },
            }}
            transformErrors={transformErrors}
            formData={formData}
            onChange={({ formData }) => {
              setFormData(formData)
              setValidationError(undefined)
            }}
            onSubmit={({ formData, errors }) => {
              if (errors && errors.length > 0) {
                setValidationError(errors)
              }
              setShowSubmissionError(false)
              setFormData(formData)
              submitChangedEntity()
            }}
            onError={(errors: AjvError[]) => {
              // invoked when submit is clicked and there are client-side validation errors
              setValidationError(errors)
              if (validationError && entityId) {
                setShowConfirmation(true)
              }
            }}
            widgets={{
              TextWidget: CustomTextWidget,
              DateTimeWidget: CustomDateTimeWidget,
              SelectWidget: CustomSelectWidget,
              CheckboxWidget: CustomBooleanWidget,
            }}
          >
            {validationError && (
              <Alert
                className="ErrorList"
                dismissible={false}
                show={true}
                variant="danger"
                transition={false}
              >
                <b>Validation errors found:</b>
                <ul>
                  {validationError.map((e: AjvError, index: number) => {
                    return (
                      <li key={index}>
                        <b>{`${getFriendlyPropertyName(e)}: `}</b>{' '}
                        {`${e.message}`}
                      </li>
                    )
                  })}
                </ul>
              </Alert>
            )}

            {submissionError && (
              <Alert
                dismissible={false}
                show={showSubmissionError}
                variant={'danger'}
                transition={false}
              >
                Annotations could not be updated: {submissionError.reason}
              </Alert>
            )}
            <hr />
            <div className="SaveButtonContainer">
              <Button
                variant="primary-500"
                onClick={() => {
                  formRef.current!.submit()
                }}
              >
                {entityId ? 'Save' : 'Validate'}
              </Button>
              {onCancel && (
                <>
                  <div className="Spacer" />
                  <Button variant="primary-500" onClick={onCancel}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </Form>
          {showConfirmation && (
            <ConfirmationModal
              show={true}
              onSave={() => {
                submitChangedEntity()
                setShowConfirmation(false)
              }}
              onCancel={() => {
                setShowConfirmation(false)
              }}
              errors={validationError}
            />
          )}
        </>
      )}
    </div>
  )
}

type ConfirmationModalProps = {
  show: boolean
  onCancel: () => void
  onSave: () => void
  errors: AjvError[] | undefined
}
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  show,
  onCancel,
  onSave,
  errors,
}: ConfirmationModalProps) => {
  return (
    <Modal animation={false} show={show} onHide={onCancel} backdrop='static'>
      <Modal.Header closeButton>
        <Modal.Title>Update Annotations</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>The following errors exist with the annotations you entered:</div>
        <div>
          <ul>
            {(errors ?? []).map((e: AjvError, index: number) => (
              <li key={index}>
                <b>{`${getFriendlyPropertyName(e)}: `}</b> {`${e.message}`}
              </li>
            ))}
          </ul>
        </div>
        <div>Are you sure you want to save them?</div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onSave}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
