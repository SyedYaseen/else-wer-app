import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useDownloadStore } from '../store/download-strore'

function Downloads() {
    const items = useDownloadStore(s => s.items)

    return (
        <View style={styles.container}>

            {Object.values(items).map(item => 
            <View key={item.bookId + "_" + item.fileId}>
                <Text>BookId: {item.bookId}</Text>
                <Text>FileId: {item.fileId}</Text>
                <Text>Progress: {item.progress * 100}</Text>
                <Text>Status: {item.status}</Text>
            </View>)}
        </View >
    )
}

const styles = StyleSheet.create({
    container: { padding: 20, flex: 1, justifyContent: 'center', backgroundColor: '#AAAAAA' },
    content: { color: 'white' }
})

export default Downloads
