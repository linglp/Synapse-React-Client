import { shallow } from 'enzyme'
import CopyToClipboardInput from '../../../../lib/containers/CopyToClipboardInput'
import { ErrorBanner } from '../../../../lib/containers/ErrorBanner'
import {
  CreateAccessTokenModal,
  CreateAccessTokenModalProps,
} from '../../../../lib/containers/personal_access_token/CreateAccessTokenModal'
import { Checkbox } from '../../../../lib/containers/widgets/Checkbox'
import * as React from 'react'
import { Button, Modal } from 'react-bootstrap'
import { act } from 'react-dom/test-utils'
import * as SynapseContext from '../../../../lib/utils/SynapseContext'
import { MOCK_CONTEXT_VALUE } from '../../../../mocks/MockSynapseContext'

const EXAMPLE_PAT = 'abcdefghiklmnop'
const SynapseClient = require('../../../../lib/utils/SynapseClient')

const mockOnClose = jest.fn(() => null)
const mockOnCreate = jest.fn(() => null)

const clickEvent: any = {
  preventDefault: () => {},
}

SynapseClient.createPersonalAccessToken = jest.fn().mockResolvedValue({
  token: EXAMPLE_PAT,
})

describe('basic functionality', () => {
  const props: CreateAccessTokenModalProps = {
    onClose: mockOnClose,
    onCreate: mockOnCreate,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .spyOn(SynapseContext, 'useSynapseContext')
      .mockImplementation(() => MOCK_CONTEXT_VALUE)
  })

  // Skiping travis build failed test. See https://sagebionetworks.jira.com/browse/PORTALS-1984
  it.skip('displays the token after successful creation', async () => {
    const tokenName = 'Token Name'
    const wrapper = shallow(<CreateAccessTokenModal {...props} />)

    // Fill out the form
    await act(async () => {
      wrapper.find('FormControl').simulate('change', {
        target: {
          value: tokenName,
        },
      })
      await wrapper.find(Checkbox).at(0).prop('onChange')()
      await wrapper.find(Checkbox).at(1).prop('onChange')()
      await wrapper.find(Checkbox).at(2).prop('onChange')()
      wrapper.find(Button).at(1).prop('onClick')!(clickEvent)
    })

    expect(mockOnCreate).toHaveBeenCalled()
    expect(SynapseClient.createPersonalAccessToken).toHaveBeenCalled()

    expect(wrapper.find(CopyToClipboardInput).props().value).toEqual(
      EXAMPLE_PAT,
    )

    // Close the modal using the 'Close' button
    expect(wrapper.find(Button).text().includes('Close')).toBe(true)
    wrapper.find(Button).prop('onClick')!(clickEvent)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it.skip('requires a token name and at least one permission before dispatching the request', async () => {
    const wrapper = shallow(<CreateAccessTokenModal {...props} />)
    expect(wrapper.find(ErrorBanner).length).toBe(0)

    // Try to create with no name or permissions
    await act(async () => {
      await wrapper.find(Checkbox).at(0).prop('onChange')()
      expect(wrapper.find(Button).at(1).text().includes('Create Token')).toBe(
        true,
      )
      wrapper.find(Button).at(1).prop('onClick')!(clickEvent)
    })
    expect(mockOnCreate).not.toHaveBeenCalled()
    expect(SynapseClient.createPersonalAccessToken).not.toHaveBeenCalled()
    expect(wrapper.find(ErrorBanner).length).toBe(1)

    // Add a name
    await act(async () => {
      wrapper.find('FormControl').simulate('change', {
        target: {
          value: 'some name',
        },
      })
      expect(wrapper.find(Button).at(1).text().includes('Create Token')).toBe(
        true,
      )
      wrapper.find(Button).at(1).prop('onClick')!(clickEvent)
    })

    expect(mockOnCreate).not.toHaveBeenCalled()
    expect(SynapseClient.createPersonalAccessToken).not.toHaveBeenCalled()
    expect(wrapper.find(ErrorBanner).length).toBe(1)

    // Remove name, add a permission
    await act(async () => {
      wrapper.find('FormControl').simulate('change', {
        target: {
          value: '',
        },
      })
      await wrapper.find(Checkbox).at(0).prop('onChange')()
      expect(wrapper.find(Button).at(1).text().includes('Create Token')).toBe(
        true,
      )
      wrapper.find(Button).at(1).prop('onClick')!(clickEvent)
    })

    expect(mockOnCreate).not.toHaveBeenCalled()
    expect(SynapseClient.createPersonalAccessToken).not.toHaveBeenCalled()
    expect(wrapper.find(ErrorBanner).length).toBe(1)
  })

  // This test fails in Travis CI with error message "cannot read property 'body' of null, but working locally.
  it.skip('gracefully handles an error from the backend', async () => {
    const wrapper = shallow(<CreateAccessTokenModal {...props} />)

    const errorReason = 'Malformed input'
    SynapseClient.createPersonalAccessToken = jest.fn().mockRejectedValue({
      error: 400,
      reason: errorReason,
    })

    // Fill out the form and send the request
    await act(async () => {
      wrapper.find('FormControl').simulate('change', {
        target: {
          value: 'token name',
        },
      })
      expect(wrapper.find(Button).at(1).text().includes('Create Token')).toBe(
        true,
      )
      wrapper.find(Button).at(1).prop('onClick')!(clickEvent)
    })

    expect(wrapper.find(ErrorBanner).length).toBe(1)
    expect(wrapper.find(ErrorBanner).props().error).toEqual(errorReason)
  })

  it('calls onClose when closing via Modal prop', async () => {
    const wrapper = shallow(<CreateAccessTokenModal {...props} />)

    // Close the modal using the prop
    wrapper.find(Modal).prop('onHide')!()

    expect(mockOnClose).toHaveBeenCalled()

    expect(mockOnCreate).not.toHaveBeenCalled()
    expect(SynapseClient.createPersonalAccessToken).not.toHaveBeenCalled()
  })

  it('calls onClose when closing via cancel button', async () => {
    const wrapper = shallow(<CreateAccessTokenModal {...props} />)

    // Close the modal using the prop
    expect(wrapper.find(Button).at(0).text().includes('Cancel')).toBe(true)
    wrapper.find(Button).at(0).prop('onClick')!(clickEvent)

    expect(mockOnClose).toHaveBeenCalled()

    expect(mockOnCreate).not.toHaveBeenCalled()
    expect(SynapseClient.createPersonalAccessToken).not.toHaveBeenCalled()
  })
})
