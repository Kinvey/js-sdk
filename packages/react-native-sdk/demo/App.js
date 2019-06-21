/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component, PureComponent } from 'react';
import { Platform, StyleSheet, Text, View, FlatList } from 'react-native';
import { DataStore, DataStoreType, User } from 'kinvey-react-native-sdk';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

class BookListItem extends PureComponent {
  render() {
    return (
      <View>
        <Text>{this.props.title}</Text>
      </View>
    );
  }
}

type Props = {};
export default class App extends Component<Props> {
  state = { books: [] };

  _keyExtractor = (item, index) => item._id;

  _renderItem = ({ item }) => (
    <BookListItem
      id={item._id}
      title={item.title}
    />
  );

  async componentDidMount() {
    await User.login('admin', 'admin');
    const collection = DataStore.collection('books', DataStoreType.Network);
    const books = await collection.find().toPromise();
    this.setState({ books });
  }

  render() {
    if (this.state.books.length > 0) {
      return (
        <View style={styles.container}>
          <FlatList
            data={this.state.books}
            keyExtractor={this._keyExtractor}
            renderItem={this._renderItem}
            style={styles.item}
          />
        </View>
      );
    }

    return (<View style={styles.container}></View>);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
})

