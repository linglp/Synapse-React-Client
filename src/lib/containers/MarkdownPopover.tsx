import { PositioningStrategy } from '@popperjs/core'
import React, { useState } from 'react'
import { Button } from 'react-bootstrap'
import { Placement } from 'react-bootstrap/esm/Overlay'
import { ButtonVariant } from 'react-bootstrap/esm/types'
import { usePopper } from 'react-popper'
import { CSSTransition } from 'react-transition-group'
import MarkdownSynapse, { MarkdownSynapseProps } from './MarkdownSynapse'
import Typography from '../utils/typography/Typography'

export type MarkdownPopoverProps = {
  children: JSX.Element
  contentProps: MarkdownSynapseProps
  style?: React.CSSProperties
  placement?: Placement
  showCloseButton?: boolean
  actionButton?: {
    content: React.ReactElement
    variant: ButtonVariant
    onClick: () => void
    closePopoverOnClick: boolean
  }
  /* Useful if the item is in an overflow container. See https://popper.js.org/docs/v2/constructors/#strategy */
  strategy?: PositioningStrategy
}

export const MarkdownPopover: React.FunctionComponent<MarkdownPopoverProps> = ({
  children,
  contentProps,
  placement,
  showCloseButton = true,
  actionButton,
  strategy,
  style,
}: MarkdownPopoverProps) => {
  placement = placement ?? 'bottom-start'

  const [show, setShow] = useState(false)

  // We intentionally use useState instead of useRef, see https://popper.js.org/react-popper/v2/#example
  const [referenceElement, setReferenceElement] =
    useState<HTMLSpanElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  )
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null)

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement,
    strategy: strategy,
    modifiers: [
      { name: 'arrow', options: { element: arrowElement } },
      {
        name: 'offset',
        options: {
          offset: [0, 10],
        },
      },
    ],
  })

  const popover = (
    <CSSTransition
      in={show}
      timeout={200}
      classNames="fade-in-out"
      mountOnEnter
    >
      <div
        className={`Tooltip SRC-popover bootstrap-4-backport`}
        style={{ ...style, ...styles.popper }}
        ref={setPopperElement}
        {...attributes.popper}
      >
        <Typography variant="body1">
          <MarkdownSynapse {...contentProps} />
        </Typography>
        <div className="TooltipButtonContainer">
          {actionButton && (
            <Button
              variant={actionButton.variant ?? 'primary-500'}
              className="pill"
              onClick={() => {
                actionButton.onClick()
                if (actionButton.closePopoverOnClick) {
                  setShow(false)
                }
              }}
            >
              {actionButton.content}
            </Button>
          )}
          {showCloseButton && (
            <Button
              variant="light"
              className="pill"
              onClick={() => setShow(false)}
            >
              Close
            </Button>
          )}
        </div>
        <div
          className="arrow"
          data-popper-arrow
          ref={setArrowElement}
          style={styles.arrow}
        />
      </div>
    </CSSTransition>
  )

  return (
    <>
      <span
        className="PopoverContainer bootstrap-4-backport"
        onClick={() => setShow(val => !val)}
        ref={setReferenceElement}
      >
        {children}
      </span>
      {popover}
    </>
  )
}
