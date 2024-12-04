import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  Modal,
  TouchableHighlight,
  Platform,
  Animated,
  Keyboard,
} from "react-native";
import Moment from "moment";
import DateTimePicker from "@react-native-community/datetimepicker";
import Style from "./style";

const FORMATS = {
  date: "YYYY-MM-DD",
  time: "HH:mm",
  datetime: "YYYY/MM/DD - HH:mm",
};

class DatePicker extends Component {
  constructor(props) {
    super(props);

    this.state = {
      date: this.getDate(),
      modalVisible: false,
      animatedHeight: new Animated.Value(0),
      allowPointerEvents: true,
      showPicker: false,
      showTimePicker: false, // Tracks when to show the time picker in datetime mode
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.date !== this.props.date) {
      this.setState({ date: this.getDate(this.props.date) });
    }
  }

  setModalVisible = (visible) => {
    const { height, duration } = this.props;

    if (visible) {
      this.setState({ modalVisible: true });
      Animated.timing(this.state.animatedHeight, {
        toValue: height,
        duration: duration,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(this.state.animatedHeight, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }).start(() => {
        this.setState({ modalVisible: false, showTimePicker: false });
      });
    }
  };

  getDate = (date = this.props.date) => {
    const { minDate, maxDate, format = FORMATS[this.props.mode] } = this.props;

    if (!date) {
      let now = new Date();
      if (minDate && now < this.getDate(minDate)) return this.getDate(minDate);
      if (maxDate && now > this.getDate(maxDate)) return this.getDate(maxDate);
      return now;
    }

    if (date instanceof Date) return date;
    return Moment(date, format).toDate();
  };

  getDateStr = (date = this.state.date) => {
    const { mode, format = FORMATS[mode] } = this.props;
    return Moment(date).format(format);
  };

  onDateChange = (event, selectedDate) => {
    const { mode } = this.props;

    if (event.type === "dismissed") {
      this.setState({ showPicker: false });
      return;
    }

    if (mode === "datetime" && !this.state.showTimePicker) {
      // Show time picker after selecting the date in datetime mode
      this.setState({ date: selectedDate || this.state.date, showTimePicker: true });
    } else {
      // For time or final datetime selection
      const newDate = selectedDate || this.state.date;
      this.setState({ date: newDate, showPicker: false, showTimePicker: false }, () => {
        this.datePicked();
      });
    }
  };

  datePicked = () => {
    const { onDateChange } = this.props;
    if (onDateChange) onDateChange(this.getDateStr(), this.state.date);
  };

  onPressDate = () => {
    if (this.props.disabled) return;

    Keyboard.dismiss();
    this.setState({ date: this.getDate(), showPicker: true, showTimePicker: false });
    if (this.props.onOpenModal) this.props.onOpenModal();
  };

  renderPicker = () => {
    const { mode, minDate, maxDate, is24Hour = true } = this.props;
    const { date, showTimePicker } = this.state;

    if (Platform.OS === "ios") {
      return (
        <DateTimePicker
          mode={showTimePicker ? "time" : "date"}
          display="spinner"
          value={date}
          minimumDate={!showTimePicker && minDate ? this.getDate(minDate) : undefined}
          maximumDate={!showTimePicker && maxDate ? this.getDate(maxDate) : undefined}
          onChange={this.onDateChange}
          locale={this.props.locale}
        />
      );
    }

    return (
      this.state.showPicker && (
        <DateTimePicker
          mode={showTimePicker ? "time" : "date"}
          value={date}
          minimumDate={!showTimePicker && minDate ? this.getDate(minDate) : undefined}
          maximumDate={!showTimePicker && maxDate ? this.getDate(maxDate) : undefined}
          is24Hour={is24Hour}
          onChange={this.onDateChange}
        />
      )
    );
  };

  render() {
    const { style, customStyles, placeholder, hideText, disabled } = this.props;
    const { modalVisible } = this.state;

    return (
      <TouchableHighlight
        style={[Style.dateTouch, style]}
        underlayColor="transparent"
        onPress={this.onPressDate}
      >
        <View style={[Style.dateTouchBody, customStyles.dateTouchBody]}>
          {!hideText && (
            <Text style={[Style.dateText, customStyles.dateText]}>
              {this.props.date ? this.getDateStr() : placeholder}
            </Text>
          )}
          {Platform.OS === "ios" && modalVisible && (
            <Modal
              transparent
              animationType="none"
              visible={modalVisible}
              supportedOrientations={["portrait", "landscape"]}
              onRequestClose={() => this.setModalVisible(false)}
            >
              <View style={Style.modalContainer}>
                {this.renderPicker()}
                <View style={Style.modalButtons}>
                  <TouchableHighlight onPress={() => this.setModalVisible(false)}>
                    <Text>Cancel</Text>
                  </TouchableHighlight>
                  <TouchableHighlight
                    onPress={() => {
                      this.datePicked();
                      this.setModalVisible(false);
                    }}
                  >
                    <Text>Confirm</Text>
                  </TouchableHighlight>
                </View>
              </View>
            </Modal>
          )}
          {Platform.OS === "android" && this.renderPicker()}
        </View>
      </TouchableHighlight>
    );
  }
}

DatePicker.propTypes = {
  mode: PropTypes.oneOf(["date", "time", "datetime"]),
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  minDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  maxDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  placeholder: PropTypes.string,
  onDateChange: PropTypes.func,
  disabled: PropTypes.bool,
  style: PropTypes.object,
  customStyles: PropTypes.object,
  locale: PropTypes.string,
};

DatePicker.defaultProps = {
  mode: "date",
  placeholder: "Select date",
  customStyles: {},
  disabled: false,
  locale: "en-US",
};

export default DatePicker;
