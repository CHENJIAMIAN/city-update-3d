/* eslint-disable no-unused-vars */
import { knockout, SvgPathBindingHandler } from 'cesium'
import KnockoutMarkdownBinding from './KnockoutMarkdownBinding'
import KnockoutHammerBinding from './KnockoutHammerBinding'
let Knockout = knockout
let registerKnockoutBindings = function () {
  SvgPathBindingHandler.register(Knockout)
  KnockoutMarkdownBinding.register(Knockout)
  KnockoutHammerBinding.register(Knockout)

  Knockout.bindingHandlers.embeddedComponent = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
      let component = Knockout.unwrap(valueAccessor())
      component.show(element)
      return { controlsDescendantBindings: true }
    },
    update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
    }
  }
}

export default registerKnockoutBindings
