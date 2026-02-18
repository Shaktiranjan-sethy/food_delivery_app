import { createSlice } from "@reduxjs/toolkit"

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    city: null,
    state: null,
    address: null,
    allShops: null,
    shop: null,
    shopsOfCity: null,
    itemsOfCity: null,
    cartItems: [],
    totalAmount: 0,
    myOrders: [],
    ownerPendingOrders: [],
    socket: null,
    deliveryBoys: [],
    searchItems: null,
    pendingOrdersCount: null
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload
    },
    setCity: (state, action) => {
      state.city = action.payload
    },
    setState: (state, action) => {
      state.state = action.payload
    },
    setAddress: (state, action) => {
      state.address = action.payload
    },
    setAllShops: (state, action) => {
      state.allShops = action.payload
    },
    setShop: (state, action) => {
      state.shop = action.payload
    }
    ,
    setShopsOfCity: (state, action) => {
      state.shopsOfCity = action.payload
    },
    setPendingOrdersCount: (state, action) => {
      state.pendingOrdersCount = action.payload
    }
    ,
    setItemsOfCity: (state, action) => {
      state.itemsOfCity = action.payload
    },
    addToCart: (state, action) => {
      const item = action.payload;
      console.log(item);
      // console.log(state.cartItems);
      const existing = state.cartItems.find(i => i.id === item.id);
      //console.log(existing);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        state.cartItems.push(item);
      }
      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.cartItems.find(i => i.id === id);

      if (item) {
        item.quantity = quantity;
      }
      //console.log(item);
      // state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    },
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter(i => i.id !== action.payload);
      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    },
    setMyOrders: (state, action) => {
      state.myOrders = action.payload
    },
    setOwnerPendingOrders: (state, action) => {
      if (Array.isArray(action.payload)) {
        // initial fetch
        state.ownerPendingOrders = action.payload;
      } else {
        // socket se single order aaya -> sabse upar lagao
        state.ownerPendingOrders = [action.payload, ...state.ownerPendingOrders];
      }
    },


    setSocket: (state, action) => {
      state.socket = action.payload
    },
    setDeliveryBoys: (state, action) => {
      state.deliveryBoys = action.payload;
    },
    setSearchItems: (state, action) => {
      state.searchItems = action.payload;
    },
  }

})

export const { setUserData, setCity, setState, setAddress, setAllShops, setShop, setShopsOfCity, setItemsOfCity, addToCart, updateQuantity, removeFromCart, setMyOrders, setOwnerPendingOrders, setSocket, setDeliveryBoys, setSearchItems, setPendingOrdersCount } = userSlice.actions
export default userSlice.reducer