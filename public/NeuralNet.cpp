#include <vector>
#include <iostream>
#include <fstream>
#include <sstream>
#include <iterator>
#include <cstdlib>
#include <cassert>
#include <cmath>

using namespace std;


// struct of neural connection
struct Connection {

	// the weight of the neuron
	double weight;

	// the change in weight of the neuron
	double deltaWeight;

};


// declare Neuron struct (class)
struct Neuron;

// declare Neuron vector
typedef vector<Neuron> Layer;


// ******************* struct (class) Neuron ************************
struct Neuron {

// The public members of a Neuron
public:
	Neuron(unsigned numOutputs, unsigned myIndex);
	void setOutput(double val) { m_output = val; }
	double getOutput(void) const { return m_output; }
	void feedForward(const Layer &prevLayer);
	void calcOutputGradients(double targets);
	void calcHiddenGradients(const Layer &nextLayer);
	void updateInputWeights(Layer &prevLayer);

// The private members of a Neuron
private:
	static double eta;
	static double alpha;
	static double transferFunction(double x);
	static double transferFunctionDerivative(double x);
	static double randomWeight(void) { return rand() / double(RAND_MAX); }
	double sumDOW(const Layer &nextLayer) const;
	double m_output;
	vector<Connection> m_outputWeights;
	unsigned m_myIndex;
	double m_gradient;

};

// Set eta and alpha to be some random double
double Neuron::eta = .15; // [0.0..1.0] overall net training rate
double Neuron::alpha = .5; // [0.0...n] multiplier of last weight change (momentum)

// Updates the connection weights for each neuron in the provided layer.
void Neuron::updateInputWeights(Layer &prevLayer) {

	for (unsigned n = 0; n < prevLayer.size(); ++n) {

		Neuron &neuron = prevLayer[n];
		double oldDelta = neuron.m_outputWeights[m_myIndex].deltaWeight;

		double newDelta = eta * neuron.getOutput() * m_gradient + alpha * oldDelta;

		neuron.m_outputWeights[m_myIndex].deltaWeight = newDelta;
		neuron.m_outputWeights[m_myIndex].weight += newDelta;

	}

}

// 
double Neuron::sumDOW(const Layer &nextLayer) const {

	double sum = 0.0;

	// sum the contributions of the errors at the nodes fed
	for (unsigned n = 0; n < nextLayer.size() - 1; ++n) {

		sum += m_outputWeights[n].weight * nextLayer[n].m_gradient;

	}

	return sum;

}

// 
void Neuron::calcHiddenGradients(const Layer &nextLayer) {

	double dow = sumDOW(nextLayer);
	m_gradient = dow * Neuron::transferFunctionDerivative(m_output);

}

// 
void Neuron::calcOutputGradients(double targets) {

	double delta = targets - m_output;
	m_gradient = delta * Neuron::transferFunctionDerivative(m_output);

}

// 
double Neuron::transferFunction(double x) {

	// tanh - output range [-1.0..1.0]
	return tanh(x);

}

// 
double Neuron::transferFunctionDerivative(double x) {

	// tanh derivative
	return 1.0 - x * x;

}

// Apply the calculations to the inputs
void Neuron::feedForward(const Layer &prevLayer) {

	double sum = 0.0;

	for (unsigned n = 0; n < prevLayer.size(); ++n) {

		sum += prevLayer[n].getOutput() * prevLayer[n].m_outputWeights[m_myIndex].weight;

	}

	m_output = Neuron::transferFunction(sum);

}

// Initialize a neuron
Neuron::Neuron(unsigned numOutputs, unsigned myIndex) {

	for (unsigned c = 0; c < numOutputs; ++c) {

		m_outputWeights.push_back(Connection());

		m_outputWeights.back().weight = randomWeight();

	}

	m_myIndex = myIndex;

}


// ******************* struct (class) Net ************************
struct Net {

	// the public members of the Net
public:
	Net(const vector<unsigned> &topology);
	void feedForward(const vector<double> &inputs);
	void backProp(const vector<double> &targets);
	void getResults(vector<double> &result) const;

	// the private members of the Net
private:
	vector<Layer> m_layers; // m_layers[layerNum][neuronNum]
	double m_error;
	double m_recentAverageError;
	double m_recentAverageSmoothingFactor;

};

// Stores the outputs to the result vector
void Net::getResults(vector<double> &result) const {

	result.clear();

	for (unsigned n = 0; n < m_layers.size() - 1; ++n) {

		result.push_back(m_layers.back()[n].getOutput());

	}
}

// Calculate the changes to the inputs
void Net::backProp(const vector<double> &targets) {

	// calculate overall net error (RMS of output neuron error)
	Layer &outerLayer = m_layers.back();
	m_error = 0.0;

	for (unsigned n = 0; n < outerLayer.size() - 1; ++n) {

		double delta = targets[n] - outerLayer[n].getOutput();

		m_error += delta * delta;

	}

	m_error /= outerLayer.size() - 1; // get the average error squared
	m_error = sqrt(m_error); // RMS

	// implement a recent average measurement
	m_recentAverageError = (m_recentAverageError * m_recentAverageSmoothingFactor + m_error) / (m_recentAverageSmoothingFactor + 1.0);

	// calculate the output layer gradients
	for (unsigned n = 0; n < outerLayer.size(); ++n) {

		outerLayer[n].calcOutputGradients(targets[n]);

	}

	// calculate the hidden layer gradients
	for (unsigned layerNum = m_layers.size() - 2; layerNum > 0; --layerNum) {

		Layer &hiddenLayer = m_layers[layerNum];
		Layer &nextLayer = m_layers[layerNum + 1];

		for (unsigned n = 0; n < hiddenLayer.size(); ++n) {

			hiddenLayer[n].calcHiddenGradients(nextLayer);

		}

	}

	// update the connection weights for all layers
	for (unsigned layerNum = m_layers.size() - 1; layerNum > 0; --layerNum) {

		Layer &layer = m_layers[layerNum];
		Layer &prevLayer = m_layers[layerNum - 1];

		for (unsigned n = 0; n < layer.size() - 1; ++n) {

			layer[n].updateInputWeights(prevLayer);

		}

	}

}

// Feed the inputs to the neural net
void Net::feedForward(const vector<double> &inputs) {

	assert(inputs.size() == m_layers[0].size() - 1);

	for (unsigned i = 0; i < inputs.size(); ++i) {

		m_layers[0][i].setOutput(inputs[i]);

	}

	for (unsigned layerNum = 1; layerNum <= m_layers.size(); ++layerNum) {

		Layer &prevLayer = m_layers[layerNum - 1];

		for (unsigned n = 0; n < m_layers[layerNum].size() - 1; ++n) {

			m_layers[layerNum][n].feedForward(prevLayer);

		}

	}

}

// Initializes the neural net.
Net::Net(const vector<unsigned> &topology) {

	unsigned numLayers = topology.size();

	for (unsigned layerNum = 0; layerNum < numLayers; ++layerNum) {

		// add a layer
		m_layers.push_back(Layer());

		unsigned numOutputs = layerNum == topology.size() - 1 ? 0 : topology[layerNum + 1];

		// fill layer with neurons and add a bias neuron
		for (unsigned neuronNum = 0; neuronNum <= topology[layerNum]; ++neuronNum) {

			m_layers.back().push_back(Neuron(numOutputs, neuronNum));
			cout << "Made a Neuron!" << endl;

		}

		// set the bias node's output to be 1.0
		m_layers.back().back().setOutput(1.0);

	}

}

// ******************* struct (class) JSON parser ************************
// Unfinished
struct Parser {

public:
	Parser(const string filename);
	void getTopology();

private:
	ifstream m_trainingFile;
	vector<unsigned> topology;

};

// Unfinished
void Parser::getTopology() {

	std::string line;
	std::string label;

	getline(m_trainingFile, line);
	std::stringstream ss(line);
	ss >> label;

	while (!ss.eof()) {
		unsigned n;
		ss >> n;
		topology.push_back(n);
	}

	return;

}

// Opens the file
Parser::Parser(const string filename) {

	m_trainingFile.open(filename);
	if (m_trainingFile.is_open()) {
		cout << "Ready" << endl;
	}

}


int main() {

	vector<unsigned> topology;
	Parser jp("./And.txt");
	jp.getTopology();

	//Net myNet(topology);

	//vector<double> inputs;
	//myNet.feedForward(inputs);

	//vector<double> targets;
	//myNet.backProp(targets);

	//vector<double> result;
	//myNet.getResults(result);

}
