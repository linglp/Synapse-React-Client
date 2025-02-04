Cookie alert example:

```jsx
const [isOpen, setIsOpen] = React.useState(false)

const onPrimaryButtonClick = () => {
  setIsOpen(false)
  alert('Accepted')
}

const onSecondaryButtonClick = () => {
  setIsOpen(false)
  alert('Open privacy policy')
}
;<div>
  <button className="btn btn-default" onClick={() => setIsOpen(true)}>
    Show Cookie Notification
  </button>
  {
    <FullWidthAlert
      variant="info"
      show={isOpen}
      title="Our site uses cookies."
      description="This website uses cookies to enhance your experience and to analyze our traffic. Using this website means that you agree with our cookie policy."
      primaryButtonConfig={{
        text: 'Accept and Continue',
        onClick: onPrimaryButtonClick,
      }}
      secondaryButtonConfig={{
        text: 'Learn More',
        tooltipText: 'Opens a PDF',
        href: 'https://s3.amazonaws.com/static.synapse.org/governance/SynapsePrivacyPolicy.pdf',
      }}
      isGlobal={true}
    />
  }
</div>
```

Download List package creation example:

```jsx
const [isOpen, setIsOpen] = React.useState(false)
const onClose = () => {
  setIsOpen(false)
}
;<div>
  <button className="btn btn-default" onClick={() => setIsOpen(true)}>
    Show Package Downloaded
  </button>
  {
    <FullWidthAlert
      variant="success"
      show={isOpen}
      title="Package has been downloaded"
      description="The files contained in this zip file have been removed from your list."
      onClose={onClose}
      isGlobal={true}
    />
  }
</div>
```
