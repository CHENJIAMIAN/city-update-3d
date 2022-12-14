/* eslint-disable no-unused-vars */
import Hammer from 'hammerjs'
import { knockout } from 'cesium'
let Knockout = knockout
let KnockoutHammerBinding = {
  register: function (Knockout) {
    Knockout.bindingHandlers.swipeLeft = {
      init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        let f = Knockout.unwrap(valueAccessor())
        new Hammer(element).on('swipeleft', function (e) {
          let viewModel = bindingContext.$data
          f.apply(viewModel, arguments)
        })
      }
    }

    Knockout.bindingHandlers.swipeRight = {
      init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        let f = Knockout.unwrap(valueAccessor())
        new Hammer(element).on('swiperight', function (e) {
          let viewModel = bindingContext.$data
          f.apply(viewModel, arguments)
        })
      }
    }
  }

}

export default KnockoutHammerBinding
