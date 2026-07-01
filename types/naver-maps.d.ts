declare namespace naver {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options: MapOptions)
      setCenter(latlng: LatLng): void
    }
    class LatLng {
      constructor(lat: number, lng: number)
    }
    class Marker {
      constructor(options: MarkerOptions)
    }
    class Point {
      constructor(x: number, y: number)
    }
    interface MapOptions {
      center: LatLng
      zoom?: number
      scaleControl?: boolean
      logoControl?: boolean
      mapDataControl?: boolean
    }
    interface MarkerOptions {
      position: LatLng
      map: Map
      icon?: {
        content: string
        anchor: Point
      }
    }
  }
}
