import { LiulianV3 } from '../apps/index.js'
import { render } from './render.js'

export class liulian extends LiulianV3 {
  constructor() {
    super()
    this.render = render
  }
}
