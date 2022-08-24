
const createFragmentFromTemplate = function (htmlString) {
  let holder = document.createElement('div')
  holder.innerHTML = htmlString
  let fragment = document.createDocumentFragment()
  while (holder.firstChild) {
    fragment.appendChild(holder.firstChild)
  }

  return fragment
}

export default createFragmentFromTemplate
