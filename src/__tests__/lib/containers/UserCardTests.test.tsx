import * as React from 'react'
import { mount, shallow } from 'enzyme'
import { SynapseConstants } from '../../../lib/utils'
import UserCard, { UserCardProps } from '../../../lib/containers/UserCard'
import {
  UserCardSmall,
  UserCardSmallProps,
} from '../../../lib/containers/UserCardSmall'
import UserCardMedium, {
  UserCardMediumProps,
} from '../../../lib/containers/UserCardMedium'
import { UserCardLarge } from '../../../lib/containers/UserCardLarge'
import { mockUserProfileData } from '../../../mocks/user/mock_user_profile'
import UserCardContextMenu, {
  UserCardContextMenuProps,
  MenuAction,
} from '../../../lib/containers/UserCardContextMenu'
import { SEPERATOR } from '../../../lib/utils/SynapseConstants'
import { Avatar, AvatarProps } from '../../../lib/containers/Avatar'
import { render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SynapseTestContext } from '../../../mocks/MockSynapseContext'
import { server } from '../../../mocks/msw/server'
import { createWrapper } from '../../../lib/testutils/TestingLibraryUtils'

jest.mock('../../../lib/utils/hooks/usePreFetchImage', () => {
  return {
    __esModule: true,
    default: jest.fn().mockResolvedValue(''),
  }
})

const { firstName } = mockUserProfileData

const createUserCardContextMenu = (props: UserCardContextMenuProps) => {
  const wrapper = shallow(<UserCardContextMenu {...props} />)
  return { wrapper }
}

const createLargeComponent = (props: UserCardMediumProps) => {
  const wrapper = shallow<UserCardMedium>(
    <UserCardMedium {...props} isLarge={true} />,
  )
  const instance = wrapper.instance()
  return { wrapper, instance }
}

const createMediumComponent = (props: UserCardMediumProps) => {
  const wrapper = mount<UserCardMedium>(<UserCardMedium {...props} />, {
    wrappingComponent: SynapseTestContext,
  })
  const instance = wrapper.find(UserCardMedium).instance()
  return { wrapper, instance }
}

const createSmallComponent = (props: UserCardSmallProps) => {
  const wrapper = shallow(<UserCardSmall {...props} />)
  const instance = wrapper.instance()
  return { wrapper, instance }
}

const createAvatarComponent = (props: AvatarProps) => {
  const wrapper = shallow(<Avatar {...props} />)
  const instance = wrapper.instance()
  return { wrapper, instance }
}

// need mount because of the deep render of the children
const createMountedComponent = (props: UserCardProps) => {
  const wrapper = mount(<UserCard {...props} />, {
    wrappingComponent: SynapseTestContext,
  })
  const instance = wrapper.instance()
  return { wrapper, instance }
}

// Handle the msw lifecycle:
beforeAll(() => server.listen())
afterEach(() => server.restoreHandlers())
afterAll(() => server.close())

describe('it renders the different sized cards without failing', () => {
  const props = {
    userProfile: mockUserProfileData,
  }

  it('renders an avatar', () => {
    const size = SynapseConstants.AVATAR
    const { wrapper } = createMountedComponent({ ...props, size })
    expect(wrapper).toBeDefined()
    expect(wrapper.find(Avatar)).toHaveLength(1)
  })

  it('renders a small card', () => {
    const size = SynapseConstants.SMALL_USER_CARD
    const { wrapper } = createMountedComponent({ ...props, size })
    expect(wrapper).toBeDefined()
    expect(wrapper.find(UserCardSmall)).toHaveLength(1)
  })

  it('renders a medium card', async () => {
    const size = SynapseConstants.MEDIUM_USER_CARD
    render(<UserCard {...props} size={size} />, { wrapper: createWrapper() })
    // This is the final uncancellable async request that gets sent in the medium and large cards
    // We wait for this explicitly to prevent the "not wrapped in act(...)" warning
    await waitFor(() => screen.getByText('ORCID', { exact: false }))
  })

  it('renders a large card', async () => {
    const size = SynapseConstants.LARGE_USER_CARD
    render(<UserCard {...props} size={size} />, { wrapper: createWrapper() })
    // This is the final uncancellable async request that gets sent in the medium and large cards
    // We wait for this explicitly to prevent the "not wrapped in act(...)" warning
    await waitFor(() => screen.getByText('ORCID', { exact: false }))
  })
})
describe('it creates the correct UI for the avatar', () => {
  const props = {
    userProfile: mockUserProfileData,
  }

  it('creates a small avatar', () => {
    const { wrapper } = createAvatarComponent({ ...props, avatarSize: 'SMALL' })
    // one svg is for the clipboard icon, the other is for the user
    expect(wrapper.find('div.SRC-userImgSmall')).toHaveLength(1)
    expect(wrapper.find('div.SRC-userImgSmall').text()).toEqual(firstName[0])
  })

  it('creates a large avatar', () => {
    const { wrapper } = createAvatarComponent({ ...props, avatarSize: 'LARGE' })
    // one svg is for the clipboard icon, the other is for the user
    expect(wrapper.find('div.SRC-userImg')).toHaveLength(1)
    expect(wrapper.find('div.SRC-userImg').text()).toEqual(firstName[0])
  })

  it('displays an svg for a user without an img', () => {
    const { wrapper } = createAvatarComponent({ ...props, imageURL: undefined })
    // one svg is for the clipboard icon, the other is for the user
    expect(wrapper.find('div.SRC-userImg')).toHaveLength(1)
    expect(wrapper.find('div.SRC-userImg').text()).toEqual(firstName[0])
  })

  it('displays an img for a user with an img set', () => {
    const { wrapper } = createAvatarComponent({
      ...props,
      imageURL: 'my-img-url',
    })
    expect(wrapper.find('div.SRC-userImg')).toHaveLength(1)
  })
})
describe('it creates the correct UI for the small card', () => {
  const props = {
    userProfile: mockUserProfileData,
    size: SynapseConstants.SMALL_USER_CARD,
    showCardOnHover: true,
  }

  it('displays a anchor with text for a user without an img', () => {
    const { wrapper } = createSmallComponent({ ...props })
    expect(wrapper.find('a.UserCardSmall')).not.toBeNull()
    expect(wrapper.find('a.UserCardSmall').text()).toEqual(
      `@${mockUserProfileData.userName}`,
    )
  })

  it('shows a medium user card when mouse enters', async () => {
    render(<UserCard {...props} />, { wrapper: createWrapper() })
    await waitFor(() => screen.getByText(`@${props.userProfile.userName}`))

    // There is no medium user card, so we shouldn't be able to find the full name anywhere
    expect(() =>
      screen.getAllByText(
        `${props.userProfile.firstName} ${props.userProfile.lastName}`,
      ),
    ).toThrowError()

    // Hover over the username
    userEvent.hover(screen.getByText(`@${props.userProfile.userName}`))

    // The card should appear, which would let us see first/last name
    // we have to wrap in a waitFor because of the delay
    await waitFor(() =>
      screen.getAllByText(
        `${props.userProfile.firstName} ${props.userProfile.lastName}`,
      ),
    )
    await waitFor(() => screen.getByText('ORCID', { exact: false }))

    // Unhover and confirm that the card disappears (we will no longer see a full name anywhere)
    userEvent.unhover(screen.getByText(`@${props.userProfile.userName}`))
    await waitFor(() =>
      expect(() =>
        screen.getAllByText(
          `${props.userProfile.firstName} ${props.userProfile.lastName}`,
        ),
      ).toThrowError(),
    )
  })

  it('creates an anchor link when showCardOnHover is false', () => {
    const link = 'someweblink.domain'
    const { wrapper } = createSmallComponent({
      ...props,
      showCardOnHover: false,
      link,
    })
    expect(wrapper.find('a.UserCardSmall')).toHaveLength(1)
    expect(wrapper.find('a.UserCardSmall').text()).toEqual(
      `@${mockUserProfileData.userName}`,
    )
    expect(wrapper.find('a.UserCardSmall').prop('href')).toEqual(link)
  })

  it('just shows the username when showCardOnHover is false and disableLink is true', () => {
    const { wrapper } = createSmallComponent({
      ...props,
      showCardOnHover: false,
      disableLink: true,
    })
    expect(wrapper.find('span.UserCardSmall')).toHaveLength(1)
    expect(wrapper.find('span.UserCardSmall').text()).toEqual(
      `@${mockUserProfileData.userName}`,
    )
  })
})

describe('it creates the correct UI for the medium card', () => {
  const props = {
    userProfile: mockUserProfileData,
    size: SynapseConstants.MEDIUM_USER_CARD,
  }

  it('shows an avatar', () => {
    const { wrapper } = createMediumComponent({ ...props })
    expect(wrapper.find(Avatar)).toHaveLength(1)
  })

  it("doesn't hide user email by default", () => {
    const { wrapper } = createMediumComponent({ ...props })
    expect(wrapper.render().find('p.SRC-emailText')).toHaveLength(1)
  })

  it("hide's user email by when hideEmail set", () => {
    const { wrapper } = createMediumComponent({ ...props, hideEmail: true })
    expect(wrapper.render().find('p.SRC-emailText')).toHaveLength(0)
  })

  it('displays the context menu on toggle', async () => {
    const menuActions = [
      {
        field: 'text',
        callback: () => {},
      },
    ] as MenuAction[]
    render(<UserCardMedium {...props} menuActions={menuActions} />, {
      wrapper: createWrapper(),
    })
    await waitFor(() => screen.getByText('ORCID', { exact: false }))
    userEvent.click(screen.getByRole('menu'))
    expect(screen.getAllByRole('menuitem')).toHaveLength(1)
  })
})

describe('it creates the correct UI for the UserCardContextMenu', () => {
  const props = {
    userProfile: mockUserProfileData,
  }

  it('renders without crashing', () => {
    const menuActions = [
      {
        field: 'text',
        callback: () => {},
      },
    ] as MenuAction[]
    const { wrapper } = createUserCardContextMenu({ ...props, menuActions })
    // one svg is for the clipboard icon, one for the ellipsis,
    // and one is for the user svg
    expect(wrapper).toBeDefined()
  })

  it('renders a break with SEPERATOR in menuActions', () => {
    const menuActions = [
      {
        field: 'text',
        callback: () => {},
      },
      {
        field: SEPERATOR,
        callback: () => {},
      },
      {
        field: 'other text',
        callback: () => {},
      },
    ] as MenuAction[]
    const { wrapper } = createUserCardContextMenu({ ...props, menuActions })
    expect(wrapper.find('hr.SRC-break')).toHaveLength(1)
  })
})
describe('it creates the correct UI for the large card', () => {
  const props = {
    userProfile: mockUserProfileData,
    size: SynapseConstants.LARGE_USER_CARD,
  }

  it("displays the user's information", async () => {
    const { wrapper } = createLargeComponent({ ...props })
    expect(wrapper.render().find('div.SRC-cardMetaData')).toHaveLength(1)
    // only two fields are set for the mock profile, so there should only be two
    // fields shown
    expect(
      wrapper.render().find('div.SRC-cardMetaData-scroll').children(),
    ).toHaveLength(2)
  })
})
