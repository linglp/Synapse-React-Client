var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import React from 'react';
import * as Utils from './utils';

var PUBLICATION_SCHEMA = {
    projectName: 0,
    id: 1,
    fundingAgency: 2,
    citation: 3,
    doi: 4,
    tumorType: 5,
    diseaseFocus: 6
};

var Publication = function (_React$Component) {
    _inherits(Publication, _React$Component);

    function Publication(props) {
        _classCallCheck(this, Publication);

        var _this = _possibleConstructorReturn(this, (Publication.__proto__ || Object.getPrototypeOf(Publication)).call(this, props));

        _this.state = {
            showMe: false
        };
        return _this;
    }

    _createClass(Publication, [{
        key: 'handleChange',
        value: function handleChange(updatedState) {
            this.setState(updatedState);
        }
    }, {
        key: 'render',
        value: function render() {
            var _props = this.props,
                data = _props.data,
                icon = _props.icon;

            var citation = data[PUBLICATION_SCHEMA.citation];
            var tumorType = data[PUBLICATION_SCHEMA.tumorType];
            var diseaseFocus = data[PUBLICATION_SCHEMA.diseaseFocus];
            return React.createElement(
                Utils.CardBorder,
                null,
                React.createElement(
                    Utils.Section,
                    null,
                    React.createElement(Utils.CardIcon, { icon: icon }),
                    React.createElement(
                        Utils.Summary,
                        null,
                        React.createElement(Utils.SummaryHeader, {
                            name: "PUBLICATION",
                            title: citation
                        }),
                        React.createElement(Utils.ChipContainer, {
                            chips: [{ type: "gray", text: tumorType }, { type: "blue", text: diseaseFocus }]
                        })
                    )
                ),
                React.createElement(Utils.Footer, null)
            );
        }
    }]);

    return Publication;
}(React.Component);

export default Publication;