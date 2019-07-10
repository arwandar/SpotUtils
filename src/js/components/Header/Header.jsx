// @flow

import React from 'react'
import { withNamespaces } from 'react-i18next'
import {
  Collapse,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Nav,
  NavItem,
  NavLink,
  Navbar,
  NavbarBrand,
  NavbarToggler,
  UncontrolledDropdown,
} from 'reactstrap'

type Props = {}
type State = { isOpen: boolean }

class Header extends React.Component<Props, State> {
  state = {
    isOpen: false,
  }

  toggle = () =>
    this.setState((prevState) => ({
      isOpen: !prevState.isOpen,
    }))

  render() {
    const { isOpen, t } = this.props
    return (
      <div>
        <Navbar color="light" light expand="md">
          <NavbarBrand href="/">{t('spotutils')}</NavbarBrand>
          <NavbarToggler onClick={this.toggle} />
          <Collapse isOpen={isOpen} navbar>
            <Nav className="ml-auto" navbar>
              <NavItem>
                <NavLink href="/components/">Components</NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="https://github.com/reactstrap/reactstrap">GitHub</NavLink>
              </NavItem>
              <UncontrolledDropdown nav inNavbar>
                <DropdownToggle nav caret>
                  Options
                </DropdownToggle>
                <DropdownMenu right>
                  <DropdownItem>Option 1</DropdownItem>
                  <DropdownItem>Option 2</DropdownItem>
                  <DropdownItem divider />
                  <DropdownItem>Reset</DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            </Nav>
          </Collapse>
        </Navbar>
      </div>
    )
  }
}

export default withNamespaces()(Header)
