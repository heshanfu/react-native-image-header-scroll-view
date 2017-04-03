// @flow

import React, { Component, PropTypes } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import type { Styles } from 'react-native';

import _ from 'lodash';

class ImageHeaderScrollView extends Component {

  props: PropsType;

  static defaultProps: $Shape<PropsType> = {
    overlayColor: 'black',
    fadeOutForeground: false,
    foregroundParallaxRatio: 1,
    maxHeight: 125,
    maxOverlayOpacity: 0.3,
    minHeight: 80,
    minOverlayOpacity: 0,
    renderFixedForeground: () => <View />,
    renderForeground: () => <View />,
    renderHeader: () => <View />,
  };

  static propTypes = {
    children: PropTypes.node || PropTypes.nodes,
    childrenStyle: View.propTypes.style,
    overlayColor: PropTypes.string,
    fadeOutForeground: PropTypes.bool,
    foregroundParallaxRatio: PropTypes.number,
    maxHeight: PropTypes.number,
    maxOverlayOpacity: PropTypes.number,
    minHeight: PropTypes.number,
    minOverlayOpacity: PropTypes.number,
    renderFixedForeground: PropTypes.func,
    renderForeground: PropTypes.func,
    renderHeader: PropTypes.func,
    ...ScrollView.propTypes,
  };

  state: StateType;
  scrollViewRef: ScrollView;
  container: View;

  constructor(props: PropsType) {
    super(props);
    this.state = {
      scrollY: new Animated.Value(0),
      pageY: 0,
    };
  }

  getChildContext() {
    return {
      scrollY: this.state.scrollY,
      scrollPageY: this.state.pageY + this.props.minHeight,
    };
  }

  /*
   * Expose `ScrollView` API so this component is composable
   * with any component that expects a `ScrollView`.
   */
  getScrollResponder() {
    return this.scrollViewRef.getScrollResponder();
  }
  getScrollableNode() {
    return this.getScrollResponder().getScrollableNode();
  }
  getInnerViewNode() {
    return this.getScrollResponder().getInnerViewNode();
  }
  setNativeProps(props: Object) {
    this.scrollViewRef.setNativeProps(props);
  }
  scrollTo(...args: Array<*>) {
    this.getScrollResponder().scrollTo(...args);
  }

  interpolateOnImageHeight(outputRange: Array<number | string>) {
    const headerScrollDistance = this.props.maxHeight - this.props.minHeight;
    return this.state.scrollY.interpolate({
      inputRange: [0, headerScrollDistance],
      outputRange,
      extrapolate: 'clamp',
    });
  }

  renderHeader() {
    const overlayOpacity = this.interpolateOnImageHeight([
      this.props.minOverlayOpacity,
      this.props.maxOverlayOpacity,
    ]);

    const headerScale = this.state.scrollY.interpolate({
      inputRange: [-this.props.maxHeight, 0],
      outputRange: [3, 1],
      extrapolate: 'clamp',
    });

    const headerTransformStyle = {
      height: this.props.maxHeight,
      transform: [{ scale: headerScale }],
    };

    const overlayStyle = [
      styles.overlay,
      { opacity: overlayOpacity, backgroundColor: this.props.overlayColor },
    ];

    return (
      <Animated.View style={[styles.header, headerTransformStyle]}>
        <Animated.View style={overlayStyle} />
        <View style={styles.fixedForeground}>
          { this.props.renderFixedForeground(this.state.scrollY) }
        </View>
        { this.props.renderHeader(this.state.scrollY) }
      </Animated.View>
    );
  }

  renderForeground() {
    const headerTranslate = this.state.scrollY.interpolate({
      inputRange: [0, this.props.maxHeight * 2],
      outputRange: [0, -this.props.maxHeight * 2 * this.props.foregroundParallaxRatio],
      extrapolate: 'clamp',
    });
    const opacity = this.interpolateOnImageHeight([1, -0.3]);

    const headerTransformStyle = {
      height: this.props.maxHeight,
      transform: [{ translateY: headerTranslate }],
      opacity: this.props.fadeOutForeground ? opacity : 1,
    };
    return (
      <Animated.View style={[styles.header, headerTransformStyle]}>
        { this.props.renderForeground() }
      </Animated.View>
    );
  }

  render() {
    const scrollViewProps = _.pick(this.props, _.keys(ScrollView.propTypes));

    const headerScrollDistance = this.interpolateOnImageHeight([
      this.props.maxHeight,
      this.props.maxHeight - this.props.minHeight,
    ]);
    const topMargin = this.interpolateOnImageHeight([0, this.props.minHeight]);

    const childrenContainerStyle = StyleSheet.flatten([
      { transform: [{ translateY: headerScrollDistance }] },
      { backgroundColor: 'white', paddingBottom: this.props.maxHeight },
      this.props.childrenStyle,
    ]);

    return (
      <View
        style={styles.container}
        ref={(ref) => { this.container = ref; }}
        onLayout={() => this.container.measureInWindow((x, y) => this.setState({ pageY: y }))}
      >
        { this.renderHeader() }
        <Animated.View style={[styles.container, { transform: [{ translateY: topMargin }] }]}>
          <ScrollView
            ref={(ref) => { this.scrollViewRef = ref; }}
            style={styles.container}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: this.state.scrollY } } }],
            )}
            {...scrollViewProps}
          >
            <Animated.View style={childrenContainerStyle}>
              {this.props.children}
            </Animated.View>
          </ScrollView>
          { this.renderForeground() }
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  headerChildren: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
  },
  fixedForeground: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    zIndex: 101,
  },
});

export type PropsType = {
  children: React$Element<*> | Array<React$Element<*>>,
  childrenStyle: Styles,
  overlayColor: string,
  fadeOutForeground: boolean,
  foregroundParallaxRatio: number,
  maxHeight: number,
  maxOverlayOpacity: number,
  minHeight: number,
  minOverlayOpacity: number,
  renderFixedForeground: (scrollY: Animated.Value) => void,
  renderForeground: (scrollY: Animated.Value) => void,
  renderHeader: (scrollY: Animated.Value) => void,
};

type StateType = {|
  scrollY: Animated.Value,
  pageY: number,
|};

ImageHeaderScrollView.childContextTypes = {
  scrollY: PropTypes.instanceOf(Animated.Value),
  scrollPageY: PropTypes.number,
};

export default ImageHeaderScrollView;
