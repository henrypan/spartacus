import { Inject, Injectable, OnDestroy, PLATFORM_ID } from '@angular/core';
import { Action, select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { StoreFinderActions } from '../store/actions/index';
import { StoreFinderSelectors } from '../store/selectors/index';
import {
  FindStoresState,
  StateWithStoreFinder,
  ViewAllStoresState,
} from '../store/store-finder-state';
import {
  GeoPoint,
  GlobalMessageService,
  GlobalMessageType,
  RoutingService,
  SearchConfig,
  WindowRef,
} from '@spartacus/core';
import { StoreEntities } from '../model';
import { filter, withLatestFrom } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class StoreFinderService implements OnDestroy {
  private geolocationWatchId: number = null;
  protected subscription = new Subscription();

  constructor(
    protected store: Store<StateWithStoreFinder>,
    protected winRef: WindowRef,
    protected globalMessageService: GlobalMessageService,
    protected routingService: RoutingService,
    @Inject(PLATFORM_ID) protected platformId: any
  ) {
    this.initialize();
  }

  /**
   * Returns boolean observable for store's loading state
   */
  getStoresLoading(): Observable<boolean> {
    return this.store.pipe(select(StoreFinderSelectors.getStoresLoading));
  }

  /**
   * Returns boolean observable for store's success state
   */
  getStoresLoaded(): Observable<boolean> {
    return this.store.pipe(select(StoreFinderSelectors.getStoresSuccess));
  }

  /**
   * Returns observable for store's entities
   */
  getFindStoresEntities(): Observable<FindStoresState> {
    return this.store.pipe(select(StoreFinderSelectors.getFindStoresEntities));
  }

  /**
   * Returns boolean observable for view all store's loading state
   */
  getViewAllStoresLoading(): Observable<boolean> {
    return this.store.pipe(
      select(StoreFinderSelectors.getViewAllStoresLoading)
    );
  }

  /**
   * Returns observable for view all store's entities
   */
  getViewAllStoresEntities(): Observable<ViewAllStoresState> {
    return this.store.pipe(
      select(StoreFinderSelectors.getViewAllStoresEntities)
    );
  }

  /**
   * Store finding action functionality
   * @param queryText text query
   * @param searchConfig search configuration
   * @param longitudeLatitude longitude and latitude coordinates
   * @param countryIsoCode country ISO code
   * @param useMyLocation current location coordinates
   * @param radius radius of the scope from the center point
   */
  findStoresAction(
    queryText: string,
    searchConfig?: SearchConfig,
    longitudeLatitude?: GeoPoint,
    countryIsoCode?: string,
    useMyLocation?: boolean,
    radius?: number
  ) {
    if (useMyLocation && this.winRef.nativeWindow) {
      this.clearWatchGeolocation(new StoreFinderActions.FindStoresOnHold());
      this.geolocationWatchId = this.winRef.nativeWindow.navigator.geolocation.watchPosition(
        (pos: Position) => {
          const position: GeoPoint = {
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude,
          };

          this.clearWatchGeolocation(
            new StoreFinderActions.FindStores({
              queryText: queryText,
              searchConfig: searchConfig,
              longitudeLatitude: position,
              countryIsoCode: countryIsoCode,
              radius: radius,
            })
          );
        },
        () => {
          this.globalMessageService.add(
            { key: 'storeFinder.geolocationNotEnabled' },
            GlobalMessageType.MSG_TYPE_ERROR
          );
          this.routingService.go(['/store-finder']);
        }
      );
    } else {
      this.clearWatchGeolocation(
        new StoreFinderActions.FindStores({
          queryText: queryText,
          searchConfig: searchConfig,
          longitudeLatitude: longitudeLatitude,
          countryIsoCode: countryIsoCode,
          radius: radius,
        })
      );
    }
  }

  /**
   * View all stores
   */
  viewAllStores() {
    this.clearWatchGeolocation(new StoreFinderActions.ViewAllStores());
  }

  /**
   * View all stores by id
   * @param storeId store id
   */
  viewStoreById(storeId: string) {
    this.clearWatchGeolocation(
      new StoreFinderActions.FindStoreById({ storeId })
    );
  }

  private clearWatchGeolocation(callbackAction: Action) {
    if (this.geolocationWatchId !== null) {
      this.winRef.nativeWindow.navigator.geolocation.clearWatch(
        this.geolocationWatchId
      );
      this.geolocationWatchId = null;
    }
    this.store.dispatch(callbackAction);
  }

  private isEmpty(store: StoreEntities): boolean {
    return (
      !store || (typeof store === 'object' && Object.keys(store).length === 0)
    );
  }

  protected initialize() {
    if (isPlatformBrowser(this.platformId)) {
      this.subscription = this.getFindStoresEntities()
        .pipe(
          filter(
            (data) =>
              this.isEmpty(data.findStoresEntities) &&
              this.isEmpty(data.findStoreEntitiesById)
          ),
          withLatestFrom(
            this.getStoresLoading(),
            this.getStoresLoaded(),
            this.routingService.getParams()
          )
        )
        .subscribe(([value, loading, loaded, params]) => {
          if (!loading && !loaded) {
            if (
              this.isEmpty(value.findStoresEntities) &&
              params.country &&
              !params.store
            ) {
              this.findStoresAction(
                '',
                {
                  pageSize: -1,
                },
                undefined,
                params.country
              );
            }
            if (params.store) {
              this.viewStoreById(params.store);
            }
          }
        });
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
