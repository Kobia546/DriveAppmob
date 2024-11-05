
export const OriginReducer = (state,action)=>{
    switch(action.type){
        case 'ADD_ORIGIN':
                return{
                    latitude:action.payload.latitude,
                    longitude:action.payload.longitude,
                    type:action.payload.type,
                    name:action.payload.name
                }
            default:
                return state
    }
}
export const DestinationReducer = (state,action)=>{
    switch(action.type){
        case 'ADD_DESTINATION':
                return{
                    latitude:action.payload.latitude,
                    longitude:action.payload.longitude,
                    type:action.payload.type,
                    name:action.payload.name
                }
            default:
                return state
    }
}